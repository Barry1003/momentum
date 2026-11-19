import "server-only";
import { getPrisma } from "@/db/client";
import { currentRun } from "@/frontend/mocks/habitRules";
import { localDateInTimezone } from "@/modules/habits/validation";
import { accessibleGoal } from "@/modules/planning/service";
import { SquadError } from "@/modules/squads/policy";
import { XP } from "@/modules/xp/config";
import { answeredReflections } from "@/modules/growth/service";
import { cheersSentCount } from "@/modules/social/service";
import { appendXp, companionFromAvatar } from "@/modules/xp/service";
import { ACHIEVEMENTS, formatDay, newlyEarned, viewOf, type Metrics } from "./catalog";
import { addDays, clampRange, datesBetween, progressSummary, type ProgressHabit } from "./rules";

const db = () => getPrisma();
const iso = (date: Date) => date.toISOString().slice(0, 10);
const asDate = (value: string) => new Date(`${value}T00:00:00.000Z`);
const ICONS = ["water", "move", "read", "sparkle"] as const;
const iconOf = (value: string | null): ProgressHabit["icon"] => (ICONS as readonly string[]).includes(value ?? "") ? value as ProgressHabit["icon"] : "sparkle";

async function userToday(userId: string): Promise<string> {
  const profile = await db().userProfile.findUnique({ where: { userId }, select: { timezone: true } });
  return localDateInTimezone(new Date(), profile?.timezone || "UTC");
}

async function companionOf(userId: string) {
  const avatar = await db().avatar.findUnique({ where: { userId }, select: { stage: true, totalXp: true } });
  return avatar ? companionFromAvatar(avatar) : null;
}

// ---------------------------------------------------------------- check-ins

export async function getCheckInStatus(userId: string) {
  const today = await userToday(userId);
  const existing = await db().checkIn.findUnique({ where: { userId_date: { userId, date: asDate(today) } }, select: { id: true } });
  return { doneToday: Boolean(existing), xpForCheckIn: existing ? 0 : XP.checkIn };
}

/** One check-in a day earns XP. Saving again updates the words and earns nothing more. */
export async function saveCheckIn(userId: string, input: { mood: string; effort: string; win: string; obstacle: string; shareCheckedIn: boolean }) {
  const today = await userToday(userId);
  const xpAwarded = await db().$transaction(async (tx) => {
    const saved = await tx.checkIn.upsert({
      where: { userId_date: { userId, date: asDate(today) } },
      create: { userId, date: asDate(today), ...input },
      update: input,
      select: { id: true },
    });
    const growth = await appendXp(tx, userId, { source: "CHECK_IN", sourceId: saved.id, key: `check-in:${today}`, amount: XP.checkIn });
    return growth.xpAwarded;
  });
  return { xpAwarded, companion: await companionOf(userId) };
}

// ---------------------------------------------------------------- progress

async function progressInput(userId: string, from: string, to: string) {
  const start = asDate(from);
  const end = asDate(addDays(to, 1));
  const [completions, sessions, habits, goals] = await Promise.all([
    db().taskCompletion.findMany({
      where: { userId, occurrenceDate: { gte: start, lt: end } },
      select: { occurrenceDate: true, task: { select: { goalId: true } } },
      take: 20000,
    }),
    db().focusSession.findMany({
      where: { userId, endedAt: { gte: start, lt: end } },
      select: { endedAt: true, focusedSeconds: true, taskId: true },
      take: 20000,
    }),
    db().habit.findMany({
      where: { ownerId: userId, status: { not: "ARCHIVED" } },
      select: { id: true, name: true, icon: true, scheduleDays: true, targetValue: true, startsOn: true,
        logs: { where: { date: { gte: start, lt: end } }, select: { date: true, value: true } } },
      take: 200,
    }),
    db().goal.findMany({
      where: { ownerId: userId, squadId: null, status: "ACTIVE", archivedAt: null },
      select: { id: true, title: true },
      take: 100,
    }),
  ]);
  const taskIds = [...new Set(sessions.map((item) => item.taskId).filter((id): id is string => Boolean(id)))];
  const taskGoals = taskIds.length
    ? await db().task.findMany({ where: { id: { in: taskIds }, ownerId: userId }, select: { id: true, goalId: true } })
    : [];
  const goalOfTask = new Map(taskGoals.map((task) => [task.id, task.goalId]));

  const focusByDay: Record<string, number> = {};
  const goalFocusByDay: Record<string, Record<string, number>> = {};
  for (const session of sessions) {
    if (!session.endedAt) continue;
    const day = iso(session.endedAt);
    const minutes = Math.round(session.focusedSeconds / 60);
    focusByDay[day] = (focusByDay[day] ?? 0) + minutes;
    const goalId = session.taskId ? goalOfTask.get(session.taskId) : null;
    if (goalId) {
      goalFocusByDay[goalId] ??= {};
      goalFocusByDay[goalId][day] = (goalFocusByDay[goalId][day] ?? 0) + minutes;
    }
  }
  const tasksByDay: Record<string, number> = {};
  const goalTasksByDay: Record<string, Record<string, number>> = {};
  for (const completion of completions) {
    const day = iso(completion.occurrenceDate);
    tasksByDay[day] = (tasksByDay[day] ?? 0) + 1;
    const goalId = completion.task.goalId;
    if (goalId) {
      goalTasksByDay[goalId] ??= {};
      goalTasksByDay[goalId][day] = (goalTasksByDay[goalId][day] ?? 0) + 1;
    }
  }
  return {
    focusByDay,
    tasksByDay,
    goalFocusByDay,
    goalTasksByDay,
    habits: habits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      icon: iconOf(habit.icon),
      scheduleDays: habit.scheduleDays,
      targetCount: habit.targetValue,
      startsOn: habit.startsOn ? iso(habit.startsOn) : undefined,
      history: Object.fromEntries(habit.logs.map((log) => [iso(log.date), log.value])),
    })),
    goals: goals.map((goal) => ({ id: goal.id, title: goal.title, isPaused: false })),
  };
}

export async function getProgress(userId: string, fromIso: string | null, toIso: string | null) {
  const today = await userToday(userId);
  const { from, to } = clampRange(fromIso, toIso, today);
  const length = datesBetween(from, to).length;
  // Load the period before too, for the change line.
  const input = await progressInput(userId, addDays(from, -length), to);
  return progressSummary(input, from, to);
}

// ---------------------------------------------------------------- goal snapshot

export async function getGoalSnapshot(userId: string, goalId: string) {
  await accessibleGoal(goalId, userId);
  const goal = await db().goal.findUniqueOrThrow({
    where: { id: goalId },
    select: {
      id: true, title: true, createdAt: true, squadId: true,
      tasks: {
        where: { archivedAt: null, OR: [{ ownerId: userId }, { visibility: "SQUAD" }] },
        select: { id: true, title: true, createdAt: true, completions: { select: { occurrenceDate: true }, take: 1 } },
        orderBy: { createdAt: "asc" },
        take: 500,
      },
    },
  });
  const focus = await db().focusSession.aggregate({
    where: { userId, taskId: { in: goal.tasks.map((task) => task.id) } },
    _sum: { focusedSeconds: true },
  });
  const done = goal.tasks.filter((task) => task.completions.length > 0);
  return {
    id: goal.id,
    title: goal.title,
    startedOn: goal.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
    isShared: Boolean(goal.squadId),
    doneCount: done.length,
    totalCount: goal.tasks.length,
    focusHours: Math.round((focus._sum.focusedSeconds ?? 0) / 360) / 10,
    areasActive: 0,
    reviews: 0,
    recent: goal.tasks.slice(-3).reverse().map((task) => {
      const completed = task.completions[0];
      return { id: task.id, title: task.title, detail: completed ? `Done ${formatDay(completed.occurrenceDate)}` : "Not yet", isDone: Boolean(completed) };
    }),
  };
}

// ---------------------------------------------------------------- achievements

async function metricsFor(userId: string): Promise<Metrics> {
  const today = await userToday(userId);
  const [tasksCompleted, focusSessions, longFocusSessions, habits] = await Promise.all([
    db().taskCompletion.count({ where: { userId } }),
    db().focusSession.findMany({ where: { userId, endedAt: { not: null }, focusedSeconds: { gte: 60 } }, select: { endedAt: true }, take: 5000 }),
    db().focusSession.count({ where: { userId, focusedSeconds: { gte: 1500 } } }),
    db().habit.findMany({
      where: { ownerId: userId, status: { not: "ARCHIVED" } },
      select: { icon: true, scheduleDays: true, targetValue: true, startsOn: true,
        logs: { where: { date: { gte: asDate(addDays(today, -400)) } }, select: { date: true, value: true } } },
      take: 200,
    }),
  ]);
  const focusDays = new Set(focusSessions.flatMap((item) => (item.endedAt ? [iso(item.endedAt)] : []))).size;
  let bestHabitRun = 0;
  const reading = new Set<string>();
  for (const habit of habits) {
    const history = Object.fromEntries(habit.logs.map((log) => [iso(log.date), log.value]));
    const rules = { scheduleDays: habit.scheduleDays, targetCount: habit.targetValue, startsOn: habit.startsOn ? iso(habit.startsOn) : undefined };
    bestHabitRun = Math.max(bestHabitRun, currentRun(rules, history, today));
    if (habit.icon === "read") for (const log of habit.logs) if (log.value >= habit.targetValue) reading.add(iso(log.date));
  }
  const [cheersSent, auditReflections] = await Promise.all([cheersSentCount(userId), answeredReflections(userId)]);
  return { tasksCompleted, focusDays, longFocusSessions, bestHabitRun, readingDays: reading.size, cheersSent, auditReflections };
}

/** Give any achievements the person has just reached: record, celebrate privately, award XP once. */
async function settleAchievements(userId: string, metrics: Metrics) {
  const earnedRows = await db().userAchievement.findMany({ where: { userId }, select: { achievementId: true } });
  const fresh = newlyEarned(metrics, new Set(earnedRows.map((row) => row.achievementId)));
  for (const definition of fresh) {
    await db().$transaction(async (tx) => {
      const existing = await tx.userAchievement.findUnique({ where: { userId_achievementId: { userId, achievementId: definition.id } } });
      if (existing) return;
      await tx.userAchievement.create({ data: { userId, achievementId: definition.id } });
      const growth = await appendXp(tx, userId, { source: "ACHIEVEMENT", sourceId: definition.id, key: `achievement:${definition.id}`, amount: definition.xp });
      await tx.growthEvent.create({ data: { userId, kind: "ACHIEVEMENT", achievementId: definition.id, atXp: growth.totalXp } });
    }).catch((error: unknown) => {
      // Another request gave this one first (unique index); that's fine. Anything else is real.
      if ((error as { code?: string } | null)?.code !== "P2002") throw error;
    });
  }
}

export async function listAchievements(userId: string) {
  const metrics = await metricsFor(userId);
  await settleAchievements(userId, metrics);
  const earned = await db().userAchievement.findMany({ where: { userId }, select: { achievementId: true, earnedAt: true, isShared: true } });
  const byId = new Map(earned.map((row) => [row.achievementId, row]));
  return ACHIEVEMENTS.map((definition) => viewOf(definition, metrics, byId.get(definition.id)));
}

export async function getAchievement(userId: string, achievementId: string) {
  const all = await listAchievements(userId);
  return all.find((item) => item.id === achievementId) ?? null;
}

/** Achievements are private unless the person shares one they've earned. */
export async function setAchievementShared(userId: string, achievementId: string, isShared: boolean) {
  const changed = await db().userAchievement.updateMany({ where: { userId, achievementId }, data: { isShared } });
  if (!changed.count) throw new SquadError("NOT_FOUND", 404, "Achievement not earned yet");
  return getAchievement(userId, achievementId);
}

export async function getPendingAchievement(userId: string) {
  await settleAchievements(userId, await metricsFor(userId));
  const event = await db().growthEvent.findFirst({
    where: { userId, kind: "ACHIEVEMENT", acknowledgedAt: null },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { achievementId: true },
  });
  if (!event?.achievementId) return null;
  return getAchievement(userId, event.achievementId);
}

export async function acknowledgeAchievement(userId: string, achievementId: string) {
  await db().growthEvent.updateMany({
    where: { userId, kind: "ACHIEVEMENT", achievementId, acknowledgedAt: null },
    data: { acknowledgedAt: new Date() },
  });
  return { acknowledged: true };
}
