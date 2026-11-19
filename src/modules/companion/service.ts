import "server-only";
import { getPrisma } from "@/db/client";
import { currentRun } from "@/frontend/mocks/habitRules";
import { localDateInTimezone } from "@/modules/habits/validation";
import { getProgress, listAchievements } from "@/modules/progress/service";
import { getProfileDetails } from "@/modules/settings/service";
import { SquadError } from "@/modules/squads/policy";
import { STAGES } from "@/modules/xp/config";
import { applyLook, buildStudio, paceNote, type Look, type Stage, type Unlocks } from "./rules";

const db = () => getPrisma();
const NAMES: Record<string, Stage> = { CHILD: "child", PRETEEN: "preteen", TEEN: "teen", YOUNG_ADULT: "youngAdult", ADULT: "adult" };
const MOOD: Record<string, string> = { heavy: "Gentle", low: "Gentle", okay: "Calm", good: "Happy", bright: "Bright" };
const short = (date: Date) => date.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

async function avatarOf(userId: string) {
  const avatar = await db().avatar.findUnique({ where: { userId }, select: { name: true, stage: true, totalXp: true, createdAt: true } });
  if (!avatar) throw new SquadError("AVATAR_REQUIRED", 409, "Meet your companion in onboarding first");
  return avatar;
}

export async function getCompanionOverview(userId: string) {
  const avatar = await avatarOf(userId);
  const index = STAGES.findIndex((item) => item.stage === avatar.stage);
  const nextAt = STAGES[index + 1]?.from ?? null;
  const [recent, stageUps, latest, achievements] = await Promise.all([
    db().xpEvent.aggregate({ where: { userId, amount: { gt: 0 }, createdAt: { gte: new Date(Date.now() - 14 * 86400000) } }, _sum: { amount: true } }),
    db().growthEvent.findMany({ where: { userId, kind: "STAGE_UP" }, select: { stage: true, createdAt: true } }),
    db().checkIn.findFirst({ where: { userId }, orderBy: { date: "desc" }, select: { mood: true } }),
    listAchievements(userId),
  ]);
  const reachedOn = new Map(stageUps.map((event) => [event.stage, event.createdAt]));
  return {
    stage: NAMES[avatar.stage] ?? "child",
    xp: avatar.totalXp,
    xpToNextStage: nextAt,
    paceNote: paceNote(avatar.totalXp, nextAt, recent._sum.amount ?? 0),
    mood: `${latest ? MOOD[latest.mood] ?? "Calm" : "Calm"} mood`,
    stages: STAGES.map((item, position) => ({
      stage: NAMES[item.stage] ?? "child",
      from: item.from,
      unlockedOn: position > index ? null : position === 0 ? short(avatar.createdAt) : reachedOn.get(item.stage) ? short(reachedOn.get(item.stage) as Date) : "Earlier",
    })),
    achievementsEarned: achievements.filter((item) => item.earnedOn).length,
    achievementsClose: achievements.filter((item) => !item.earnedOn && item.progress && item.progress.done / item.progress.total >= 0.6).length,
  };
}

async function unlocksFor(userId: string, stage: Stage): Promise<Unlocks> {
  const profile = await db().userProfile.findUnique({ where: { userId }, select: { timezone: true } });
  const today = localDateInTimezone(new Date(), profile?.timezone || "UTC");
  const [habits, goalDone, squad, deepDiver] = await Promise.all([
    db().habit.findMany({
      where: { ownerId: userId, status: { not: "ARCHIVED" } },
      select: { scheduleDays: true, targetValue: true, startsOn: true, logs: { where: { date: { gte: new Date(Date.now() - 400 * 86400000) } }, select: { date: true, value: true } } },
      take: 200,
    }),
    db().goal.count({ where: { ownerId: userId, status: "COMPLETED" } }),
    db().squadMember.count({ where: { userId, status: "ACTIVE", squad: { status: "ACTIVE" } } }),
    db().userAchievement.count({ where: { userId, achievementId: "deep-diver" } }),
  ]);
  const longestRun = Math.max(0, ...habits.map((habit) => currentRun(
    { scheduleDays: habit.scheduleDays, targetCount: habit.targetValue, startsOn: habit.startsOn ? habit.startsOn.toISOString().slice(0, 10) : undefined },
    Object.fromEntries(habit.logs.map((log) => [log.date.toISOString().slice(0, 10), log.value])),
    today,
  )));
  return { stage, longestRun, goalDone: goalDone > 0, inSquad: squad > 0, deepDiver: deepDiver > 0 };
}

async function lookOf(userId: string, name: string): Promise<Look> {
  const row = await db().companionLook.findUnique({ where: { userId } });
  return { name, room: row?.room ?? "lavender", plinth: row?.plinth ?? "cream", outfit: row?.outfit ?? "original", accents: row?.accents ?? [] };
}

export async function getStudio(userId: string) {
  const avatar = await avatarOf(userId);
  const stage = NAMES[avatar.stage] ?? "child";
  return buildStudio(await lookOf(userId, avatar.name), await unlocksFor(userId, stage));
}

/** Only options open to this person are applied. The name lives on the avatar; nothing here changes the stage. */
export async function saveLook(userId: string, changes: { name?: string; room?: string; plinth?: string; outfit?: string; accents?: string[] }) {
  const avatar = await avatarOf(userId);
  const stage = NAMES[avatar.stage] ?? "child";
  const unlocks = await unlocksFor(userId, stage);
  const next = applyLook(await lookOf(userId, avatar.name), changes, unlocks);
  await db().$transaction([
    db().avatar.update({ where: { userId }, data: { name: next.name } }),
    db().companionLook.upsert({
      where: { userId },
      create: { userId, room: next.room, plinth: next.plinth, outfit: next.outfit, accents: next.accents },
      update: { room: next.room, plinth: next.plinth, outfit: next.outfit, accents: next.accents },
    }),
  ]);
  return buildStudio(next, unlocks);
}

/** The small card on Me: name, handle, squad and active days this week. */
export async function getProfileSummary(userId: string) {
  const [profile, details, membership] = await Promise.all([
    db().userProfile.findUnique({ where: { userId }, select: { displayName: true } }),
    getProfileDetails(userId),
    db().squadMember.findFirst({ where: { userId, status: "ACTIVE", squad: { status: "ACTIVE" } }, orderBy: { squad: { createdAt: "desc" } }, select: { squad: { select: { name: true, _count: { select: { members: { where: { status: "ACTIVE" } } } } } } } }),
  ]);
  const user = profile ? null : await db().user.findUnique({ where: { id: userId }, select: { name: true } });
  const today = new Date().toISOString().slice(0, 10);
  const monday = (() => {
    const date = new Date(`${today}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
    return date.toISOString().slice(0, 10);
  })();
  const week = await getProgress(userId, monday, today);
  return {
    displayName: profile?.displayName || user?.name || "Friend",
    handle: `@${details.handle}`,
    squadName: membership?.squad.name ?? null,
    squadMembers: membership?.squad._count.members ?? 0,
    activeDays: week.activeDays,
  };
}
