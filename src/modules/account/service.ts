import "server-only";
import { getPrisma } from "@/db/client";
import { SquadError } from "@/modules/squads/policy";
import { CODE_TTL_MS, DELETION_DELAY_DAYS, MAX_ATTEMPTS, MAX_REQUESTS_PER_HOUR, hashCode, newCode, sameHash } from "./codes";
import { sendAccountCode, sendEmailChangedNotice } from "./email";

const db = () => getPrisma();
type Kind = "EMAIL_CHANGE" | "DELETE_ACCOUNT";

/** Squads this person owns that still have other members: they must hand those over first. */
async function ownedSquadsWithOthers(userId: string) {
  const squads = await db().squad.findMany({
    where: { ownerId: userId, status: "ACTIVE" },
    select: { name: true, members: { where: { status: "ACTIVE", userId: { not: userId } }, select: { userId: true }, take: 1 } },
    take: 20,
  });
  return squads.filter((squad) => squad.members.length > 0);
}

export async function getAccount(userId: string) {
  const [user, pending, deletion, blocking, anySquad] = await Promise.all([
    db().user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } }),
    db().accountRequest.findFirst({
      where: { userId, kind: "EMAIL_CHANGE", consumedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { newEmail: true },
    }),
    db().accountDeletion.findUnique({ where: { userId }, select: { scheduledFor: true, cancelledAt: true } }),
    ownedSquadsWithOthers(userId),
    db().squadMember.findFirst({ where: { userId, status: "ACTIVE", squad: { status: "ACTIVE" } }, select: { squad: { select: { name: true } } } }),
  ]);
  return {
    email: user.email,
    pendingEmail: pending?.newEmail ?? null,
    export: { state: "none" as const, requestedAt: null, fileName: null },
    ownsSquadAlone: blocking.length > 0,
    squadName: blocking[0]?.name ?? anySquad?.squad.name ?? null,
    deletionScheduledFor: deletion && !deletion.cancelledAt ? deletion.scheduledFor.toISOString().slice(0, 10) : null,
  };
}

/** Make a code, store only its hash, and email it. Limited to a few per hour. */
async function issueCode(userId: string, kind: Kind, to: string, newEmail: string | null, send = true) {
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await db().accountRequest.count({ where: { userId, kind, createdAt: { gte: hourAgo } } });
  if (recent >= MAX_REQUESTS_PER_HOUR) throw new SquadError("RATE_LIMITED", 429, "Too many codes. Try again in an hour.");
  // Older codes for the same change stop working.
  await db().accountRequest.updateMany({ where: { userId, kind, consumedAt: null }, data: { consumedAt: new Date() } });
  const code = newCode();
  const request = await db().accountRequest.create({
    data: { userId, kind, codeHash: "pending", newEmail, expiresAt: new Date(Date.now() + CODE_TTL_MS) },
    select: { id: true },
  });
  await db().accountRequest.update({ where: { id: request.id }, data: { codeHash: hashCode(code, userId, request.id) } });
  if (send) await sendAccountCode({ to, code, purpose: kind === "EMAIL_CHANGE" ? "email-change" : "delete-account" });
}

/** Check a code. Wrong guesses count, and a code dies after five. Returns the request when it matches. */
async function useCode(userId: string, kind: Kind, code: string) {
  const request = await db().accountRequest.findFirst({
    where: { userId, kind, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!request) throw new SquadError("CODE_EXPIRED", 400, "That code has expired. Send a new one.");
  if (request.attempts >= MAX_ATTEMPTS) throw new SquadError("TOO_MANY_ATTEMPTS", 429, "Too many tries. Send a new code.");
  if (!sameHash(request.codeHash, hashCode(code, userId, request.id))) {
    await db().accountRequest.update({ where: { id: request.id }, data: { attempts: { increment: 1 } } });
    throw new SquadError("CODE_MISMATCH", 400, "That code doesn’t match. Check the latest email.");
  }
  const claimed = await db().accountRequest.updateMany({ where: { id: request.id, consumedAt: null }, data: { consumedAt: new Date() } });
  if (!claimed.count) throw new SquadError("CODE_EXPIRED", 400, "That code has already been used.");
  return request;
}

/** Send a code to the new address. The email changes only once that code comes back. */
export async function requestEmailChange(userId: string, newEmail: string) {
  const user = await db().user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
  if (newEmail === user.email.toLowerCase()) throw new SquadError("SAME_EMAIL", 400, "That’s already your email.");
  // Same answer whether or not the address is taken, so this can't be used to find accounts.
  // A taken address gets a request that no code can ever match, and no email.
  const taken = await db().user.findUnique({ where: { email: newEmail }, select: { id: true } });
  await issueCode(userId, "EMAIL_CHANGE", newEmail, newEmail, !taken);
  return { previewCode: null as string | null };
}

export async function confirmEmailChange(userId: string, code: string) {
  const request = await useCode(userId, "EMAIL_CHANGE", code);
  if (!request.newEmail) throw new SquadError("CODE_EXPIRED", 400, "Start again: there’s no change waiting.");
  const before = await db().user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
  try {
    await db().user.update({ where: { id: userId }, data: { email: request.newEmail, emailVerified: true } });
  } catch (error) {
    if ((error as { code?: string } | null)?.code === "P2002") throw new SquadError("EMAIL_UNAVAILABLE", 409, "That email can’t be used. Try another.");
    throw error;
  }
  // Tell the old address, in case it wasn't them. A failed notice doesn't undo the change.
  await sendEmailChangedNotice(before.email).catch(() => undefined);
  return getAccount(userId);
}

/** Send a deletion code to the current email. Blocked while the person still owns a squad with others in it. */
export async function sendDeletionCode(userId: string) {
  if ((await ownedSquadsWithOthers(userId)).length) throw new SquadError("OWNER_TRANSFER_REQUIRED", 409, "Pass your squad on first.");
  const user = await db().user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } });
  await issueCode(userId, "DELETE_ACCOUNT", user.email, null);
  return { sent: true };
}

/** Schedule deletion 14 days out. Nothing is deleted now, and it can be cancelled until then. */
export async function requestAccountDeletion(userId: string, code: string) {
  if ((await ownedSquadsWithOthers(userId)).length) throw new SquadError("OWNER_TRANSFER_REQUIRED", 409, "Pass your squad on first.");
  await useCode(userId, "DELETE_ACCOUNT", code);
  const scheduledFor = new Date(Date.now() + DELETION_DELAY_DAYS * 24 * 60 * 60 * 1000);
  await db().accountDeletion.upsert({
    where: { userId },
    create: { userId, scheduledFor },
    update: { scheduledFor, requestedAt: new Date(), cancelledAt: null },
  });
  return getAccount(userId);
}

export async function cancelAccountDeletion(userId: string) {
  await db().accountDeletion.updateMany({ where: { userId, cancelledAt: null }, data: { cancelledAt: new Date() } });
  return getAccount(userId);
}

/** Everything this person made, and nothing anyone else made. */
export async function exportData(userId: string) {
  const [user, profile, settings, avatar, goals, tasks, habits, habitLogs, focusSessions, checkIns, achievements] = await Promise.all([
    db().user.findUniqueOrThrow({ where: { id: userId }, select: { email: true, name: true, createdAt: true } }),
    db().userProfile.findUnique({ where: { userId }, select: { displayName: true, timezone: true } }),
    db().userSettings.findUnique({ where: { userId } }),
    db().avatar.findUnique({ where: { userId }, select: { name: true, artStyle: true, bodyForm: true, stage: true, totalXp: true } }),
    db().goal.findMany({ where: { ownerId: userId }, select: { title: true, why: true, area: true, status: true, targetDate: true, createdAt: true, completedAt: true, milestones: { select: { title: true, reachedAt: true, criteria: { select: { label: true, done: true } } } } } }),
    db().task.findMany({ where: { ownerId: userId }, select: { title: true, notes: true, dueDate: true, dueTime: true, priority: true, visibility: true, createdAt: true, completions: { select: { occurrenceDate: true } } } }),
    db().habit.findMany({ where: { ownerId: userId }, select: { name: true, description: true, targetType: true, targetValue: true, unit: true, scheduleDays: true, status: true, createdAt: true } }),
    db().habitLog.findMany({ where: { userId }, select: { date: true, value: true, habit: { select: { name: true } } }, take: 50000 }),
    db().focusSession.findMany({ where: { userId }, select: { startedAt: true, endedAt: true, focusedSeconds: true, mode: true, xpAwarded: true }, take: 50000 }),
    db().checkIn.findMany({ where: { userId }, select: { date: true, mood: true, effort: true, win: true, obstacle: true } }),
    db().userAchievement.findMany({ where: { userId }, select: { achievementId: true, earnedAt: true, isShared: true } }),
  ]);
  const settingsCopy = settings ? Object.fromEntries(Object.entries(settings).filter(([key]) => key !== "userId")) : null;
  return { exportedAt: new Date().toISOString(), account: user, profile, settings: settingsCopy, companion: avatar, goals, tasks, habits, habitLogs, focusSessions, checkIns, achievements };
}
