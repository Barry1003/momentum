import "server-only";
import { appendXp } from "@/modules/xp/service";
import { XP } from "@/modules/xp/config";
import { localDateInTimezone } from "@/modules/habits/validation";
import { getPrisma } from "@/db/client";
import { activeMember } from "@/modules/squads/service";
import { SquadError } from "@/modules/squads/policy";
import { canCompleteTask, canEditGoal, canReadTask, validTaskScope } from "./policy";
import { asUtcDate, type createGoalSchema, type updateGoalSchema, type createTaskSchema, type updateTaskSchema } from "./validation";
import type { z } from "zod";

const db = () => getPrisma();
const notFound = () => new SquadError("NOT_FOUND", 404, "Resource not found");
type CreateGoal = z.infer<typeof createGoalSchema>;
type UpdateGoal = z.infer<typeof updateGoalSchema>;
type CreateTask = z.infer<typeof createTaskSchema>;
type UpdateTask = z.infer<typeof updateTaskSchema>;

export async function createGoal(userId: string, input: CreateGoal) {
  if (input.squadId) await activeMember(input.squadId, userId);
  return db().$transaction(async tx => {
    const goal = await tx.goal.create({
      data: {
        title: input.title, why: input.why, area: input.area,
        targetDate: input.targetDate ? asUtcDate(input.targetDate) : undefined,
        ownerId: userId, squadId: input.squadId ?? null,
      },
    });
    if (input.squadId) {
      await tx.goalMember.create({ data: { goalId: goal.id, userId, role: "EDITOR" } });
    }
    return goal;
  });
}

export async function accessibleGoal(goalId: string, userId: string, edit = false) {
  const goal = await db().goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.archivedAt) throw notFound();
  if (!goal.squadId) {
    if (goal.ownerId !== userId) throw notFound();
    return goal;
  }
  try {
    await activeMember(goal.squadId, userId);
  } catch {
    throw notFound();
  }
  const membership = await db().goalMember.findUnique({
    where: { goalId_userId: { goalId, userId } }, select: { role: true },
  });
  if (!membership && goal.ownerId !== userId) throw notFound();
  if (edit && !canEditGoal(goal.ownerId, userId, membership?.role ?? null)) {
    throw new SquadError("FORBIDDEN", 403, "Goal is read-only");
  }
  return goal;
}

export async function listGoals(userId: string) {
  return db().goal.findMany({
    where: {
      archivedAt: null,
      OR: [
        { ownerId: userId, squadId: null },
        {
          squadId: { not: null },
          members: { some: { userId } },
          squad: { is: { status: "ACTIVE", members: { some: { userId, status: "ACTIVE" } } } },
        },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function updateGoal(goalId: string, userId: string, input: UpdateGoal) {
  await accessibleGoal(goalId, userId, true);
  const { targetDate, ...fields } = input;
  return db().goal.update({
    where: { id: goalId },
    data: {
      ...fields,
      ...(targetDate !== undefined ? { targetDate: targetDate === null ? null : asUtcDate(targetDate) } : {}),
    },
  });
}

export async function archiveGoal(goalId: string, userId: string) {
  await accessibleGoal(goalId, userId, true);
  await db().goal.update({ where: { id: goalId }, data: { archivedAt: new Date(), status: "ARCHIVED" } });
  return { archived: true };
}

export async function completeGoal(goalId: string, userId: string) {
  await accessibleGoal(goalId, userId, true);
  const goal = await db().goal.update({
    where: { id: goalId }, data: { completedAt: new Date(), status: "COMPLETED" },
  });
  return { goal, xpAwarded: 0 };
}

export async function createTask(userId: string, input: CreateTask) {
  const squadId = input.squadId ?? null;
  if (!validTaskScope(input.visibility, squadId)) {
    throw new SquadError("INVALID_SCOPE", 400, "Shared tasks require a squad");
  }
  if (squadId) await activeMember(squadId, userId);
  if (input.goalId) {
    const goal = await accessibleGoal(input.goalId, userId, true);
    if (goal.squadId !== squadId) {
      throw new SquadError("INVALID_SCOPE", 400, "Task and goal must use the same scope");
    }
  }
  if (input.assigneeId && input.assigneeId !== userId) {
    if (!squadId || input.visibility !== "SQUAD") throw new SquadError("INVALID_ASSIGNEE", 400, "Another member can only be assigned a squad-visible task");
    await activeMember(squadId, input.assigneeId);
  }
  return db().task.create({
    data: {
      ownerId: userId, title: input.title, notes: input.notes,
      dueDate: input.dueDate ? asUtcDate(input.dueDate) : undefined,
      dueTime: input.dueTime, durationMin: input.durationMin,
      priority: input.priority, visibility: input.visibility, quadrant: input.quadrant,
      squadId, goalId: input.goalId ?? null, assigneeId: input.assigneeId ?? null,
    },
  });
}

export async function accessibleTask(taskId: string, userId: string) {
  const task = await db().task.findUnique({ where: { id: taskId } });
  if (!task || task.archivedAt) throw notFound();
  let active = false;
  if (task.squadId) {
    try {
      await activeMember(task.squadId, userId);
      active = true;
    } catch {
      active = false;
    }
  }
  // Even the creator loses shared-squad access after leaving.
  if (task.squadId && !active) throw notFound();
  if (!canReadTask(task.ownerId, userId, task.visibility, active)) throw notFound();
  return task;
}

export async function listTasks(userId: string) {
  return db().task.findMany({
    where: {
      archivedAt: null,
      OR: [
        { ownerId: userId, squadId: null },
        { ownerId: userId, squad: { is: { members: { some: { userId, status: "ACTIVE" } } } } },
        { visibility: "SQUAD", squad: { is: { members: { some: { userId, status: "ACTIVE" } } } } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function updateTask(taskId: string, userId: string, input: UpdateTask) {
  const task = await accessibleTask(taskId, userId);
  if (task.ownerId !== userId) throw new SquadError("FORBIDDEN", 403, "Only the creator may edit this task");
  const { dueDate, ...fields } = input;
  return db().task.update({
    where: { id: taskId },
    data: {
      ...fields,
      ...(dueDate !== undefined ? { dueDate: dueDate === null ? null : asUtcDate(dueDate) } : {}),
    },
  });
}

export async function archiveTask(taskId: string, userId: string) {
  const task = await accessibleTask(taskId, userId);
  if (task.ownerId !== userId) throw new SquadError("FORBIDDEN", 403, "Only the creator may archive this task");
  await db().task.update({ where: { id: taskId }, data: { archivedAt: new Date() } });
  return { archived: true };
}

export async function completeTask(taskId: string, userId: string, occurrenceDate: string) {
  const task = await accessibleTask(taskId, userId);
  const profile = await db().userProfile.findUnique({ where: { userId }, select: { timezone: true } });
  const today = localDateInTimezone(new Date(), profile?.timezone ?? "UTC");
  if (occurrenceDate !== today) throw new SquadError("INVALID_DATE", 400, "Tasks can only be completed for today");
  if (!canCompleteTask(task.ownerId, task.assigneeId, userId))
    throw new SquadError("FORBIDDEN", 403, "Only the assignee may complete this task");
  return db().$transaction(async tx => {
    // Lock the task for concurrent create/reopen races.
    await tx.$queryRaw`SELECT id FROM "task" WHERE id = ${taskId} FOR UPDATE`;
    const date = asUtcDate(occurrenceDate);
    const existing = await tx.taskCompletion.findUnique({
      where: { taskId_occurrenceDate: { taskId, occurrenceDate: date } },
      select: { id: true, completedAt: true },
    });
    if (existing) return { completion: existing, xpAwarded: 0, stageChanged: false };
    // A task is one-time until recurring task definitions are implemented.
    const prior = await tx.taskCompletion.findFirst({ where: { taskId }, select: { id: true } });
    if (prior) throw new SquadError("ALREADY_COMPLETED", 409, "Task is already complete");
    const completion = await tx.taskCompletion.create({
      data: { taskId, userId, occurrenceDate: date },
      select: { id: true, completedAt: true },
    });
    const growth = await appendXp(tx, userId, {
      source: "TASK", sourceId: completion.id, key: `task:${completion.id}:award`, amount: XP.task,
    });
    return { completion, xpAwarded: growth.xpAwarded, stageChanged: growth.stageChanged };
  });
}

export async function reopenTask(taskId: string, userId: string, occurrenceDate: string) {
  const task = await accessibleTask(taskId, userId);
  if (!canCompleteTask(task.ownerId, task.assigneeId, userId))
    throw new SquadError("FORBIDDEN", 403, "Only the assignee may reopen this task");
  return db().$transaction(async tx => {
    await tx.$queryRaw`SELECT id FROM "task" WHERE id = ${taskId} FOR UPDATE`;
    const completion = await tx.taskCompletion.findUnique({
      where: { taskId_occurrenceDate: { taskId, occurrenceDate: asUtcDate(occurrenceDate) } },
      select: { id: true, userId: true },
    });
    if (!completion) return { reopened: true, xpAwarded: 0 };
    if (completion.userId !== userId) throw new SquadError("NOT_FOUND", 404, "Completion not found");
    await tx.taskCompletion.delete({ where: { id: completion.id } });
    // The original event stays in the ledger, with a compensating entry.
    const award = await tx.xpEvent.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey: `task:${completion.id}:award` } },
      select: { amount: true },
    });
    const growth = award ? await appendXp(tx, userId, {
      source: "TASK", sourceId: completion.id, key: `task:${completion.id}:undo`, amount: -award.amount,
    }) : { xpAwarded: 0 };
    return { reopened: true, xpAwarded: growth.xpAwarded };
  });
}
