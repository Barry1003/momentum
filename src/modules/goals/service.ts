import "server-only";
import { getPrisma } from "@/db/client";
import { localDateInTimezone } from "@/modules/habits/validation";
import { accessibleGoal, completeTask, createTask } from "@/modules/planning/service";
import { SquadError } from "@/modules/squads/policy";
import { XP } from "@/modules/xp/config";
import { appendXp, companionFromAvatar } from "@/modules/xp/service";
import { dueDateFor, milestoneStatuses, shortDay, targetLabel, taskDetail } from "./rules";

const db = () => getPrisma();
const notFound = () => new SquadError("NOT_FOUND", 404, "Resource not found");

async function userToday(userId: string): Promise<string> {
  const profile = await db().userProfile.findUnique({ where: { userId }, select: { timezone: true } });
  return localDateInTimezone(new Date(), profile?.timezone || "UTC");
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function scheduleLabel(days: number[]): string {
  if (days.length === 7) return "every day";
  if (days.length === 5 && [1, 2, 3, 4, 5].every((day) => days.includes(day))) return "weekdays";
  return days.map((day) => DAYS[day]).join(", ");
}

/** Everything the goal screen shows. Only tasks the person may see are included. */
export async function getGoalDetail(userId: string, goalId: string) {
  await accessibleGoal(goalId, userId);
  const today = await userToday(userId);
  const goal = await db().goal.findUniqueOrThrow({
    where: { id: goalId },
    select: {
      id: true, title: true, why: true, squadId: true, ownerId: true, targetDate: true, createdAt: true, completedAt: true, status: true,
      squad: { select: { name: true } },
      milestones: {
        orderBy: { position: "asc" },
        select: { id: true, title: true, reachedAt: true, criteria: { orderBy: { position: "asc" }, select: { id: true, label: true, done: true } } },
      },
      tasks: {
        where: { archivedAt: null, OR: [{ ownerId: userId }, { visibility: "SQUAD" }] },
        orderBy: { createdAt: "asc" },
        take: 500,
        select: {
          id: true, title: true, dueDate: true, createdAt: true, ownerId: true, assigneeId: true,
          owner: { select: { name: true, profile: { select: { displayName: true } } } },
          completions: { orderBy: { completedAt: "desc" }, take: 1, select: { userId: true, completedAt: true, occurrenceDate: true } },
        },
      },
      habits: { where: { ownerId: userId, status: { not: "ARCHIVED" } }, take: 1, select: { name: true, scheduleDays: true } },
    },
  });
  const statuses = milestoneStatuses(goal.milestones);
  const nameOf = (task: (typeof goal.tasks)[number]) => task.owner.profile?.displayName || task.owner.name;
  const done = goal.tasks.filter((task) => task.completions.length > 0);
  const focus = await db().focusSession.aggregate({
    where: { userId, taskId: { in: goal.tasks.map((task) => task.id) } },
    _sum: { focusedSeconds: true },
  });

  const activity = [
    ...goal.tasks.flatMap((task) => {
      const completed = task.completions[0];
      return completed ? [{ at: completed.completedAt, kind: "task" as const, text: `${task.title} completed` }] : [];
    }),
    ...goal.tasks.map((task) => ({ at: task.createdAt, kind: "added" as const, text: `${task.title} added` })),
    ...goal.milestones.flatMap((milestone) => (milestone.reachedAt ? [{ at: milestone.reachedAt, kind: "milestone" as const, text: `${milestone.title} reached` }] : [])),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 20)
    .map((item, index) => ({ id: `a-${index}`, kind: item.kind, text: item.text, when: item.at.toISOString().slice(0, 10) === today ? "Today" : shortDay(item.at) }));

  const contributors = goal.squadId
    ? [...new Map(goal.tasks.map((task) => [task.ownerId, task])).values()].map((task) => ({
        name: task.ownerId === userId ? "You" : nameOf(task),
        doneCount: done.filter((item) => item.ownerId === task.ownerId).length,
        isOwner: task.ownerId === goal.ownerId,
        isYou: task.ownerId === userId,
      }))
    : [];

  const habit = goal.habits[0];
  return {
    id: goal.id,
    title: goal.title,
    why: goal.why,
    isShared: Boolean(goal.squadId),
    isPaused: false,
    squadName: goal.squad?.name,
    targetLabel: targetLabel(goal.targetDate),
    startedOn: shortDay(goal.createdAt),
    completedOn: goal.completedAt ? shortDay(goal.completedAt) : null,
    doneCount: done.length,
    totalCount: goal.tasks.length,
    milestones: goal.milestones.map((milestone, index) => ({
      id: milestone.id,
      title: milestone.title,
      status: statuses[index] ?? "later",
      reachedOn: milestone.reachedAt ? shortDay(milestone.reachedAt) : undefined,
      criteria: milestone.criteria,
    })),
    tasks: goal.tasks.map((task) => {
      const completed = task.completions[0];
      const due = task.dueDate?.toISOString().slice(0, 10);
      return {
        id: task.id,
        title: task.title,
        detail: taskDetail({ dueDate: task.dueDate, doneOn: completed ? completed.occurrenceDate : null }, today),
        isDone: Boolean(completed),
        todayTaskId: !completed && due === today ? task.id : undefined,
        assignee: goal.squadId ? (task.ownerId === userId ? "You" : nameOf(task)) : undefined,
      };
    }),
    linkedHabit: habit ? { name: habit.name, detail: scheduleLabel(habit.scheduleDays) } : null,
    activity,
    contributors,
    focusHours: Math.round((focus._sum.focusedSeconds ?? 0) / 360) / 10,
  };
}

async function companionOf(userId: string) {
  const avatar = await db().avatar.findUnique({ where: { userId }, select: { stage: true, totalXp: true } });
  return avatar ? companionFromAvatar(avatar) : null;
}

/** A task added from a goal is linked to it (same scope) and shows in the Planner too. */
export async function addGoalTask(userId: string, goalId: string, input: { title: string; when: "today" | "tomorrow" | "pickDate" | "noDate"; date?: string; priority?: "high" | "medium" | "low" }) {
  const goal = await accessibleGoal(goalId, userId, true);
  const today = await userToday(userId);
  await createTask(userId, {
    title: input.title,
    dueDate: dueDateFor(input.when, today, input.date),
    priority: input.priority ? (input.priority.toUpperCase() as "HIGH" | "MEDIUM" | "LOW") : "NONE",
    visibility: goal.squadId ? "SQUAD" : "PRIVATE",
    goalId,
    ...(goal.squadId ? { squadId: goal.squadId } : {}),
  });
  return getGoalDetail(userId, goalId);
}

/** Finish one of the goal's tasks. XP comes from the normal task completion, once. */
export async function completeGoalTask(userId: string, goalId: string, taskId: string) {
  await accessibleGoal(goalId, userId);
  const task = await db().task.findUnique({ where: { id: taskId }, select: { goalId: true } });
  if (!task || task.goalId !== goalId) throw notFound();
  const today = await userToday(userId);
  let xpAwarded = 0;
  try {
    xpAwarded = (await completeTask(taskId, userId, today)).xpAwarded;
  } catch (error) {
    // Finishing an already-finished task is a no-op here, as on the goal screen.
    if (!(error instanceof SquadError && error.code === "ALREADY_COMPLETED")) throw error;
  }
  return { goal: await getGoalDetail(userId, goalId), companion: await companionOf(userId), xpAwarded };
}

/** Add a milestone at the end, with an optional checklist. Editors only. */
export async function addMilestone(userId: string, goalId: string, input: { title: string; criteria: string[] }) {
  await accessibleGoal(goalId, userId, true);
  await db().$transaction(async (tx) => {
    const count = await tx.goalMilestone.count({ where: { goalId } });
    if (count >= 12) throw new SquadError("LIMIT_REACHED", 409, "A goal can have up to 12 milestones");
    await tx.goalMilestone.create({
      data: { goalId, title: input.title, position: count, criteria: { create: input.criteria.map((label, position) => ({ label, position })) } },
    });
  });
  return getGoalDetail(userId, goalId);
}

async function milestoneOf(goalId: string, milestoneId: string) {
  const milestone = await db().goalMilestone.findUnique({ where: { id: milestoneId }, select: { goalId: true, reachedAt: true } });
  if (!milestone || milestone.goalId !== goalId) throw notFound();
  return milestone;
}

/** Tick or untick a checklist line. Reached milestones are settled and can't change. */
export async function toggleCriterion(userId: string, goalId: string, milestoneId: string, criterionId: string) {
  await accessibleGoal(goalId, userId, true);
  const milestone = await milestoneOf(goalId, milestoneId);
  if (milestone.reachedAt) return getGoalDetail(userId, goalId);
  const criterion = await db().goalCriterion.findUnique({ where: { id: criterionId }, select: { milestoneId: true, done: true } });
  if (!criterion || criterion.milestoneId !== milestoneId) throw notFound();
  await db().goalCriterion.update({ where: { id: criterionId }, data: { done: !criterion.done } });
  return getGoalDetail(userId, goalId);
}

/**
 * The person confirms the current milestone; confirming is what makes it count.
 * Reaching the last one reaches the goal. Repeat calls award nothing.
 */
export async function confirmMilestone(userId: string, goalId: string, milestoneId: string) {
  await accessibleGoal(goalId, userId, true);
  await milestoneOf(goalId, milestoneId);
  const outcome = await db().$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "goal" WHERE id = ${goalId} FOR UPDATE`;
    const milestones = await tx.goalMilestone.findMany({ where: { goalId }, orderBy: { position: "asc" }, select: { id: true, reachedAt: true } });
    const statuses = milestoneStatuses(milestones);
    const index = milestones.findIndex((item) => item.id === milestoneId);
    if (index < 0 || statuses[index] !== "current") return { xpAwarded: 0, goalReachedXp: null as number | null };
    const now = new Date();
    await tx.goalMilestone.update({ where: { id: milestoneId }, data: { reachedAt: now, reachedById: userId } });
    const milestoneXp = await appendXp(tx, userId, { source: "MILESTONE", sourceId: milestoneId, key: `milestone:${milestoneId}`, amount: XP.milestone });
    let goalReachedXp: number | null = null;
    if (index === milestones.length - 1) {
      await tx.goal.update({ where: { id: goalId }, data: { status: "COMPLETED", completedAt: now } });
      const goalXp = await appendXp(tx, userId, { source: "GOAL", sourceId: goalId, key: `goal:${goalId}:reached`, amount: XP.goal });
      goalReachedXp = goalXp.xpAwarded || null;
    }
    return { xpAwarded: milestoneXp.xpAwarded, goalReachedXp };
  });
  return { goal: await getGoalDetail(userId, goalId), companion: await companionOf(userId), ...outcome };
}
