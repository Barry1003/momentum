import "server-only";
import { getPrisma } from "@/db/client";
import { localDateInTimezone } from "@/modules/habits/validation";
import { settingsOf } from "@/modules/settings/service";
import { SquadError } from "@/modules/squads/policy";
import { CHEERS_PER_DAY, REPORTS_PER_DAY } from "./validation";

const db = () => getPrisma();
const notFound = () => new SquadError("NOT_FOUND", 404, "Not found");
const DAY_MS = 24 * 60 * 60 * 1000;
const STAGE_LABEL: Record<string, string> = { CHILD: "Child · Stage 1", PRETEEN: "Preteen · Stage 2", TEEN: "Teen · Stage 3", YOUNG_ADULT: "Young Adult · Stage 4", ADULT: "Adult · Stage 5" };
const STAGE_NAME: Record<string, string> = { CHILD: "a Child", PRETEEN: "a Preteen", TEEN: "a Teen", YOUNG_ADULT: "a Young Adult", ADULT: "an Adult" };

const displayName = (user: { name: string; profile: { displayName: string } | null }) => user.profile?.displayName || user.name;

/** The person's current squad: the most recently created active one, as the app shows. */
async function mySquad(userId: string) {
  const membership = await db().squadMember.findFirst({
    where: { userId, status: "ACTIVE", squad: { status: "ACTIVE" } },
    orderBy: { squad: { createdAt: "desc" } },
    select: { squad: { select: { id: true, name: true } } },
  });
  return membership?.squad ?? null;
}

/** A squad both people are active in, or null. Everything about another person goes through this. */
async function sharedSquad(userId: string, otherId: string) {
  if (userId === otherId) return null;
  const squad = await db().squad.findFirst({
    where: {
      status: "ACTIVE",
      AND: [
        { members: { some: { userId, status: "ACTIVE" } } },
        { members: { some: { userId: otherId, status: "ACTIVE" } } },
      ],
    },
    select: { id: true, name: true },
  });
  return squad;
}

async function todayFor(userId: string) {
  const profile = await db().userProfile.findUnique({ where: { userId }, select: { timezone: true } });
  return localDateInTimezone(new Date(), profile?.timezone || "UTC");
}

// ---------------------------------------------------------------- member share

/** Only what this member chose to share, and only to people in a squad with them. */
export async function getMemberShare(viewerId: string, memberId: string) {
  if (!(await sharedSquad(viewerId, memberId))) throw notFound();
  const [settings, today] = await Promise.all([settingsOf(memberId), todayFor(memberId)]);
  const now = new Date();
  const [checkIn, focusing, focusToday, avatar, sharedDone] = await Promise.all([
    settings.shareCheckedIn ? db().checkIn.findUnique({ where: { userId_date: { userId: memberId, date: new Date(`${today}T00:00:00.000Z`) } }, select: { shareCheckedIn: true } }) : null,
    settings.shareFocusStatus ? db().focusSession.findFirst({ where: { userId: memberId, endedAt: null, startedAt: { gte: new Date(now.getTime() - 3 * 60 * 60 * 1000) } }, orderBy: { startedAt: "desc" }, select: { startedAt: true, plannedMinutes: true } }) : null,
    settings.shareFocusStatus ? db().focusSession.aggregate({ where: { userId: memberId, endedAt: { gte: new Date(`${today}T00:00:00.000Z`) } }, _sum: { focusedSeconds: true } }) : null,
    settings.shareGrowthStage || settings.shareStreaksAndXp ? db().avatar.findUnique({ where: { userId: memberId }, select: { stage: true, totalXp: true } }) : null,
    settings.shareFinishedSharedTasks ? db().taskCompletion.count({ where: { userId: memberId, occurrenceDate: new Date(`${today}T00:00:00.000Z`), task: { visibility: "SQUAD" } } }) : 0,
  ]);
  const minutesIn = focusing ? Math.floor((now.getTime() - focusing.startedAt.getTime()) / 60000) : null;
  const stillFocusing = focusing && minutesIn !== null && minutesIn <= focusing.plannedMinutes;
  const checkedIn = Boolean(checkIn?.shareCheckedIn);
  const shares: { label: string; value: string }[] = [];
  if (settings.shareCheckedIn) shares.push({ label: "Checked in today", value: checkedIn ? "✓" : "Not yet" });
  if (settings.shareFocusStatus) shares.push({ label: "Focus today", value: `${Math.round((focusToday?._sum.focusedSeconds ?? 0) / 60)} min` });
  if (settings.shareFinishedSharedTasks) shares.push({ label: "Shared tasks done today", value: String(sharedDone) });
  if (settings.shareStreaksAndXp && avatar) shares.push({ label: "XP", value: String(avatar.totalXp) });
  return {
    status: stillFocusing ? `Focusing · ${Math.max(1, minutesIn ?? 0)} min` : checkedIn ? "Checked in" : null,
    stageLabel: settings.shareGrowthStage && avatar ? STAGE_LABEL[avatar.stage] ?? null : null,
    shares,
  };
}

// ---------------------------------------------------------------- cheers, mutes, reports

/** A few cheers per person per day keeps them meaningful. */
export async function sendCheer(fromUserId: string, toUserId: string, message: string, momentId: string | null = null) {
  const squad = await sharedSquad(fromUserId, toUserId);
  if (!squad) throw notFound();
  const since = new Date(Date.now() - DAY_MS);
  const sent = await db().cheer.count({ where: { fromUserId, toUserId, createdAt: { gte: since } } });
  if (sent >= CHEERS_PER_DAY) throw new SquadError("RATE_LIMITED", 429, "That’s plenty of cheer for today. Try again tomorrow.");
  await db().cheer.create({ data: { fromUserId, toUserId, squadId: squad.id, message, momentId } });
  return { remaining: CHEERS_PER_DAY - sent - 1 };
}

export async function setMuted(userId: string, mutedUserId: string, muted: boolean) {
  if (!(await sharedSquad(userId, mutedUserId))) throw notFound();
  if (muted) {
    await db().squadMute.upsert({ where: { userId_mutedUserId: { userId, mutedUserId } }, create: { userId, mutedUserId }, update: {} });
  } else {
    await db().squadMute.deleteMany({ where: { userId, mutedUserId } });
  }
  return { muted };
}

/** Reports go only to the safety team. The reported person is never told who reported. */
export async function submitSquadReport(reporterId: string, input: { reason: string; details: string; reportedUserId?: string | null }) {
  const squad = input.reportedUserId ? await sharedSquad(reporterId, input.reportedUserId) : await mySquad(reporterId);
  if (!squad) throw notFound();
  const recent = await db().squadReport.count({ where: { reporterId, createdAt: { gte: new Date(Date.now() - DAY_MS) } } });
  if (recent >= REPORTS_PER_DAY) throw new SquadError("RATE_LIMITED", 429, "You’ve sent several reports today. We’re looking at them.");
  const report = await db().squadReport.create({
    data: { reporterId, squadId: squad.id, reportedUserId: input.reportedUserId ?? null, reason: input.reason, details: input.details },
    select: { id: true },
  });
  return { id: report.id };
}

// ---------------------------------------------------------------- squad progress & moments

export async function getSquadProgress(userId: string) {
  const squad = await mySquad(userId);
  if (!squad) return { hasSquad: false, squadName: "", focusedHours: 0, tasksDone: 0, checkedIn: 0, members: 0, sharedGoal: null, moments: [] };
  const members = await db().squadMember.findMany({
    where: { squadId: squad.id, status: "ACTIVE" },
    select: { userId: true, user: { select: { name: true, profile: { select: { displayName: true } } } } },
  });
  const ids = members.map((member) => member.userId);
  const [settingsRows, mutes] = await Promise.all([
    db().userSettings.findMany({ where: { userId: { in: ids } } }),
    db().squadMute.findMany({ where: { userId }, select: { mutedUserId: true } }),
  ]);
  const settingsById = new Map(settingsRows.map((row) => [row.userId, row]));
  // No settings row means the defaults, which share all four of these.
  const shares = (id: string, key: "shareCheckedIn" | "shareFocusStatus" | "shareGrowthStage" | "shareFinishedSharedTasks") => settingsById.get(id)?.[key] ?? true;
  const muted = new Set(mutes.map((row) => row.mutedUserId));
  const weekAgo = new Date(Date.now() - 7 * DAY_MS);
  const today = await todayFor(userId);
  const focusIds = ids.filter((id) => shares(id, "shareFocusStatus"));
  const [focus, tasksDone, checkIns, goal, stageUps, achievements, myCheers] = await Promise.all([
    db().focusSession.aggregate({ where: { userId: { in: focusIds }, endedAt: { gte: weekAgo } }, _sum: { focusedSeconds: true } }),
    db().taskCompletion.count({ where: { userId: { in: ids.filter((id) => shares(id, "shareFinishedSharedTasks")) }, completedAt: { gte: weekAgo }, task: { squadId: squad.id, visibility: "SQUAD" } } }),
    db().checkIn.count({ where: { userId: { in: ids.filter((id) => shares(id, "shareCheckedIn")) }, date: new Date(`${today}T00:00:00.000Z`), shareCheckedIn: true } }),
    db().goal.findFirst({ where: { squadId: squad.id, status: "ACTIVE", archivedAt: null }, orderBy: { createdAt: "desc" }, select: { id: true, title: true, tasks: { where: { archivedAt: null, visibility: "SQUAD" }, select: { completions: { select: { id: true }, take: 1 } } } } }),
    db().growthEvent.findMany({ where: { userId: { in: ids.filter((id) => shares(id, "shareGrowthStage")) }, kind: "STAGE_UP", createdAt: { gte: new Date(Date.now() - 14 * DAY_MS) } }, orderBy: { createdAt: "desc" }, take: 10, select: { id: true, userId: true, stage: true, createdAt: true } }),
    db().userAchievement.findMany({ where: { userId: { in: ids }, isShared: true, earnedAt: { gte: new Date(Date.now() - 14 * DAY_MS) } }, orderBy: { earnedAt: "desc" }, take: 10, select: { id: true, userId: true, achievementId: true, earnedAt: true } }),
    db().cheer.findMany({ where: { fromUserId: userId, momentId: { not: null } }, select: { momentId: true }, take: 500 }),
  ]);
  const nameOf = new Map(members.map((member) => [member.userId, displayName(member.user)]));
  const cheered = new Set(myCheers.map((row) => row.momentId));
  const when = (at: Date) => at.toISOString().slice(0, 10) === today ? "Today" : at.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" });
  const moments = [
    ...stageUps.map((event) => ({ id: `stage:${event.id}`, userId: event.userId, at: event.createdAt, text: `${event.userId === userId ? "Ari" : `${nameOf.get(event.userId)}’s companion`} became ${STAGE_NAME[event.stage ?? "CHILD"]}` })),
    ...achievements.map((item) => ({ id: `achievement:${item.id}`, userId: item.userId, at: item.earnedAt, text: `${item.userId === userId ? "You" : nameOf.get(item.userId)} earned “${item.achievementId.replace(/-/g, " ")}”` })),
  ]
    .filter((moment) => !muted.has(moment.userId))
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 12)
    .map((moment) => ({
      id: moment.id,
      name: moment.userId === userId ? "You" : nameOf.get(moment.userId) ?? "Someone",
      text: moment.text,
      when: when(moment.at),
      canCheer: moment.userId !== userId && !cheered.has(moment.id),
    }));
  return {
    hasSquad: true,
    squadName: squad.name,
    focusedHours: Math.round((focus._sum.focusedSeconds ?? 0) / 360) / 10,
    tasksDone,
    checkedIn: checkIns,
    members: members.length,
    sharedGoal: goal ? { id: goal.id, title: goal.title, doneCount: goal.tasks.filter((task) => task.completions.length).length, totalCount: goal.tasks.length } : null,
    moments,
  };
}

/** Cheer a moment: a "High five" to the person it belongs to, once per moment. */
export async function cheerMoment(userId: string, momentId: string) {
  const [kind, rowId] = momentId.split(":");
  const ownerId = kind === "stage"
    ? (await db().growthEvent.findUnique({ where: { id: rowId ?? "" }, select: { userId: true } }))?.userId
    : kind === "achievement"
      ? await db().userAchievement.findUnique({ where: { id: rowId ?? "" }, select: { userId: true, isShared: true } }).then((row) => (row?.isShared ? row.userId : undefined))
      : undefined;
  if (!ownerId) throw notFound();
  const already = await db().cheer.findFirst({ where: { fromUserId: userId, momentId }, select: { id: true } });
  if (already) return { remaining: 0 };
  return sendCheer(userId, ownerId, "High five", momentId);
}

// ---------------------------------------------------------------- shared goal

/** The squad's latest shared goal, with only what each member chose to show. */
export async function getSharedGoal(userId: string) {
  const squad = await mySquad(userId);
  if (!squad) return null;
  const goal = await db().goal.findFirst({
    where: { squadId: squad.id, status: "ACTIVE", archivedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, why: true, ownerId: true, targetDate: true,
      owner: { select: { name: true, profile: { select: { displayName: true } } } },
      members: { select: { userId: true } },
      tasks: { where: { archivedAt: null, visibility: "SQUAD" }, select: { ownerId: true, title: true, completions: { select: { id: true }, take: 1 } } },
    },
  });
  if (!goal) return null;
  const [prefs, memberCount, names] = await Promise.all([
    db().goalSharePref.findMany({ where: { goalId: goal.id } }),
    db().squadMember.count({ where: { squadId: squad.id, status: "ACTIVE" } }),
    db().user.findMany({ where: { id: { in: [...new Set(goal.tasks.map((task) => task.ownerId))] } }, select: { id: true, name: true, profile: { select: { displayName: true } } } }),
  ]);
  const prefOf = new Map(prefs.map((row) => [row.userId, row]));
  const joinedIds = new Set([goal.ownerId, ...goal.members.map((member) => member.userId)]);
  const mine = prefOf.get(userId);
  const counted = goal.tasks.filter((task) => prefOf.get(task.ownerId)?.showCount ?? true);
  const doneBy = new Map<string, number>();
  for (const task of counted) if (task.completions.length) doneBy.set(task.ownerId, (doneBy.get(task.ownerId) ?? 0) + 1);
  const nameById = new Map(names.map((user) => [user.id, displayName(user)]));
  const contributors = [...doneBy.entries()]
    .filter(([id]) => id === userId || prefOf.get(id)?.showNames || id === goal.ownerId)
    .map(([id, done]) => ({ name: id === userId ? "You" : nameById.get(id) ?? "Someone", done }));
  const daysLeft = goal.targetDate ? Math.max(0, Math.ceil((goal.targetDate.getTime() - Date.now()) / DAY_MS)) : 0;
  return {
    id: goal.id,
    title: goal.title,
    outcome: goal.why ?? goal.title,
    dueLabel: goal.targetDate ? goal.targetDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" }) : "no date",
    suggestedBy: goal.ownerId === userId ? "You" : displayName(goal.owner),
    linkedTaskTitle: goal.tasks.find((task) => task.ownerId === userId)?.title ?? "your next task",
    joined: joinedIds.has(userId),
    prefs: { linkTask: mine?.linkTask ?? true, showCount: mine?.showCount ?? true, showNames: mine?.showNames ?? false },
    joinedCount: joinedIds.size,
    memberCount,
    daysLeft,
    doneCount: counted.filter((task) => task.completions.length).length,
    totalCount: goal.tasks.length,
    contributors,
  };
}

/** Joining lets the member add their own linked tasks. It's always optional. */
export async function joinSharedGoal(userId: string, prefs: { linkTask: boolean; showCount: boolean; showNames: boolean }) {
  const goal = await getSharedGoal(userId);
  if (!goal) throw notFound();
  await db().$transaction([
    db().goalMember.upsert({ where: { goalId_userId: { goalId: goal.id, userId } }, create: { goalId: goal.id, userId, role: "EDITOR" }, update: {} }),
    db().goalSharePref.upsert({ where: { goalId_userId: { goalId: goal.id, userId } }, create: { goalId: goal.id, userId, ...prefs }, update: prefs }),
  ]);
  return getSharedGoal(userId);
}

/** Leaving keeps the person's tasks; they just stop counting toward the shared goal. */
export async function leaveSharedGoal(userId: string) {
  const goal = await getSharedGoal(userId);
  if (!goal) throw notFound();
  await db().$transaction([
    db().goalMember.deleteMany({ where: { goalId: goal.id, userId } }),
    db().goalSharePref.deleteMany({ where: { goalId: goal.id, userId } }),
  ]);
  return getSharedGoal(userId);
}

export async function cheersSentCount(userId: string): Promise<number> {
  return db().cheer.count({ where: { fromUserId: userId } });
}
