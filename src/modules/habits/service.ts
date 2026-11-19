import "server-only";
import { appendXp } from "@/modules/xp/service";
import { XP } from "@/modules/xp/config";
import { currentRun, isScheduledOn } from "@/frontend/mocks/habitRules";
import { getPrisma } from "@/db/client";
import { SquadError } from "@/modules/squads/policy";
import { activeMember } from "@/modules/squads/service";
import { accessibleGoal } from "@/modules/planning/service";
import { asUtcDate } from "@/modules/planning/validation";
import { isCompleted, localDateInTimezone, type createHabitSchema, type updateHabitSchema } from "./validation";
import type { z } from "zod";

const db = () => getPrisma();
const missing = () => new SquadError("NOT_FOUND", 404, "Habit not found");
type CreateHabit = z.infer<typeof createHabitSchema>;
type UpdateHabit = z.infer<typeof updateHabitSchema>;

export async function createHabit(userId: string, input: CreateHabit) {
  if (input.sharedWithSquadId) await activeMember(input.sharedWithSquadId, userId);
  if (input.goalId) {
    const goal = await accessibleGoal(input.goalId, userId, true);
    if (goal.squadId !== (input.sharedWithSquadId ?? null)) {
      throw new SquadError("INVALID_SCOPE", 400, "Habit and goal scopes must match");
    }
  }
  return db().habit.create({
    data: {
      ownerId: userId, name: input.name, description: input.description, category: input.category,
      icon: input.icon, targetType: input.targetType, targetValue: input.targetValue, unit: input.unit,
      reminderTime: input.reminderTime, scheduleDays: input.scheduleDays ?? [0,1,2,3,4,5,6],
      startsOn: input.startsOn ? asUtcDate(input.startsOn) : null, goalId: input.goalId ?? null,
      sharedWithSquadId: input.sharedWithSquadId ?? null,
    },
  });
}

export async function getHabit(id: string, userId: string) {
  const habit = await db().habit.findUnique({ where: { id } });
  if (!habit || habit.ownerId !== userId || habit.archivedAt) throw missing();
  return habit;
}

export async function listHabits(userId: string) {
  return db().habit.findMany({
    where: { ownerId: userId, archivedAt: null },
    orderBy: { createdAt: "desc" }, take: 50,
  });
}

export async function updateHabit(id: string, userId: string, fields: UpdateHabit) {
  await getHabit(id, userId);
  return db().habit.update({ where: { id }, data: fields });
}

export async function archiveHabit(id: string, userId: string) {
  await getHabit(id, userId);
  await db().habit.update({ where: { id }, data: { status: "ARCHIVED", archivedAt: new Date() } });
  return { archived: true };
}

export async function changeHabitPause(id: string, userId: string, paused: boolean, weeks: number | null = null) {
  const habit = await getHabit(id, userId);
  if (habit.status === "ARCHIVED") throw missing();
  return db().habit.update({
    where: { id }, data: {
      status: paused ? "PAUSED" : "ACTIVE",
      pausedAt: paused ? habit.pausedAt ?? new Date() : null,
      pausedUntil: paused && weeks ? asUtcDate(new Date(Date.now() + weeks * 7 * 86400000).toISOString().slice(0, 10)) : null,
    },
  });
}

async function validateLogDate(userId: string, date: string) {
  const profile = await db().userProfile.findUnique({
    where: { userId }, select: { timezone: true },
  });
  const localToday = localDateInTimezone(new Date(), profile?.timezone || "UTC");
  if (date > localToday) throw new SquadError("FUTURE_DATE", 400, "Cannot record future habit progress");
  return localToday;
}

/** Return an ISO day for a stored DATE without server-timezone drift. */
const day = (date: Date) => date.toISOString().slice(0, 10);

export async function logHabit(id: string, userId: string, date: string, value: number) {
  const habit = await getHabit(id, userId);
  const today = await validateLogDate(userId, date);
  // A timed pause that has run out counts as resumed (kept from main's pause behaviour).
  const pauseExpired = habit.status === "PAUSED" && habit.pausedUntil !== null && day(habit.pausedUntil) < today;
  if (habit.status !== "ACTIVE" && !pauseExpired)
    throw new SquadError("HABIT_PAUSED", 409, "Resume this habit to log progress");
  if (!isScheduledOn({
    scheduleDays: habit.scheduleDays, targetCount: habit.targetValue,
    startsOn: habit.startsOn ? day(habit.startsOn) : undefined,
  }, date)) throw new SquadError("UNSCHEDULED_DAY", 409, "Habit is not scheduled for that day");
  if (value > habit.targetValue)
    throw new SquadError("INVALID_INPUT", 400, "Habit progress cannot exceed its target");
  return db().$transaction(async tx => {
    // All writes for the same habit are serialized before examining the previous value.
    await tx.$queryRaw`SELECT id FROM "habit" WHERE id = ${id} FOR UPDATE`;
    if (pauseExpired) {
      await tx.habit.update({ where: { id }, data: { status: "ACTIVE", pausedAt: null, pausedUntil: null } });
    }
    const previous = await tx.habitLog.findUnique({
      where: { habitId_date: { habitId: id, date: asUtcDate(date) } },
    });
    const oldValue = previous?.value ?? 0;
    if (date !== today && value > oldValue) {
      throw new SquadError("INVALID_DATE", 400, "XP can only be earned from today's habit progress");
    }
    const maxIncrease = habit.targetType === "DURATION" ? habit.targetValue : 1;
    if (value > oldValue + maxIncrease) {
      throw new SquadError("INVALID_INPUT", 400, "Habit progress must be logged one step at a time");
    }
    if (oldValue === value) {
      return { log: previous, xpAwarded: 0, moment: null };
    }
    const nextRevision = (previous?.revision ?? 0) + 1;
    const completed = isCompleted(habit.targetType, habit.targetValue, value);
    const log = await tx.habitLog.upsert({
      where: { habitId_date: { habitId: id, date: asUtcDate(date) } },
      create: { habitId: id, userId, date: asUtcDate(date), value, completed, revision: nextRevision },
      update: { value, completed, revision: nextRevision, loggedAt: new Date() },
    });
    // Each increment is worth five XP, matching the mock repository. Decrements reverse it.
    const amount = (value - oldValue) * XP.habitUnit;
    const earned = await appendXp(tx, userId, {
      source: "HABIT", sourceId: log.id,
      key: `habit:${log.id}:rev:${nextRevision}`, amount,
    });
    let xpAwarded = earned.xpAwarded;
    let moment: { habitId: string; habitName: string; days: number; xpAwarded: number } | null = null;
    if (completed && !previous?.completed) {
      const logs = await tx.habitLog.findMany({
        where: { habitId: id, date: { lte: asUtcDate(date) } },
        select: { date: true, value: true }, orderBy: { date: "desc" }, take: 400,
      });
      const history = Object.fromEntries(logs.map(row => [day(row.date), row.value]));
      const streak = currentRun({
        scheduleDays: habit.scheduleDays, targetCount: habit.targetValue,
        startsOn: habit.startsOn ? day(habit.startsOn) : undefined,
      }, history, date);
      const bonus = XP.habitMoments[streak] ?? 0;
      if (bonus) {
        // One consistency milestone per habit/date, even if its log is later edited.
        const key = `habit-moment:${id}:${date}:${streak}`;
        const oldBonus = await tx.xpEvent.findUnique({
          where: { userId_idempotencyKey: { userId, idempotencyKey: key } },
          select: { id: true },
        });
        if (!oldBonus) {
          const extra = await appendXp(tx, userId, {
            source: "HABIT_MOMENT", sourceId: log.id, key, amount: bonus,
          });
          xpAwarded += extra.xpAwarded;
          moment = { habitId: id, habitName: habit.name, days: streak, xpAwarded: bonus };
        }
      }
    }
    return { log, xpAwarded, moment };
  });
}

export async function clearHabitLog(id: string, userId: string, date: string) {
  await getHabit(id, userId);
  await validateLogDate(userId, date);
  return db().$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "habit" WHERE id = ${id} FOR UPDATE`;
    const previous = await tx.habitLog.findUnique({
      where: { habitId_date: { habitId: id, date: asUtcDate(date) } },
    });
    if (!previous) return { cleared: true };
    // Set value to zero but retain the log row so revision ids cannot be recycled.
    const revision = previous.revision + 1;
    await tx.habitLog.update({
      where: { id: previous.id },
      data: { value: 0, completed: false, revision, loggedAt: new Date() },
    });
    await appendXp(tx, userId, {
      source: "HABIT", sourceId: previous.id,
      key: `habit:${previous.id}:rev:${revision}`, amount: -previous.value * XP.habitUnit,
    });
    return { cleared: true };
  });
}

export async function habitHistory(userId: string, habitId?: string) {
  if (habitId) await getHabit(habitId, userId);
  return db().habitLog.findMany({
    where: { userId, ...(habitId ? { habitId } : {}) },
    select: { habitId: true, date: true, value: true, completed: true, loggedAt: true },
    orderBy: { date: "desc" }, take: 50,
  });
}
