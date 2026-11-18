import "server-only";
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
}

export async function logHabit(id: string, userId: string, date: string, value: number) {
  const habit = await getHabit(id, userId);
  if (habit.status !== "ACTIVE") {
    const today = new Date().toISOString().slice(0, 10);
    if (!habit.pausedUntil || habit.pausedUntil.toISOString().slice(0, 10) >= today) {
      throw new SquadError("HABIT_PAUSED", 409, "Resume this habit to log progress");
    }
    await db().habit.update({ where: { id }, data: { status: "ACTIVE", pausedAt: null, pausedUntil: null } });
  }
  await validateLogDate(userId, date);
  const completed = isCompleted(habit.targetType, habit.targetValue, value);
  const log = await db().habitLog.upsert({
    where: { habitId_date: { habitId: id, date: asUtcDate(date) } },
    create: { habitId: id, userId, date: asUtcDate(date), value, completed },
    update: { value, completed, loggedAt: new Date() },
    select: { id: true, date: true, value: true, completed: true, loggedAt: true },
  });
  // No XP award yet. F06 will handle first-time completed log sources transactionally.
  return { log, xpAwarded: 0 };
}

export async function clearHabitLog(id: string, userId: string, date: string) {
  await getHabit(id, userId);
  await db().habitLog.deleteMany({ where: { habitId: id, date: asUtcDate(date) } });
  return { cleared: true };
}

export async function habitHistory(userId: string, habitId?: string) {
  if (habitId) await getHabit(habitId, userId);
  return db().habitLog.findMany({
    where: { userId, ...(habitId ? { habitId } : {}) },
    select: { habitId: true, date: true, value: true, completed: true, loggedAt: true },
    orderBy: { date: "desc" }, take: 50,
  });
}
