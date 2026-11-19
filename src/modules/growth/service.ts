import "server-only";
import { randomUUID } from "node:crypto";
import type { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/db/client";
import { createHabit } from "@/modules/habits/service";
import { localDateInTimezone } from "@/modules/habits/validation";
import { accessibleGoal, accessibleTask, createGoal, createTask, updateTask } from "@/modules/planning/service";
import { SquadError } from "@/modules/squads/policy";
import { appendXp } from "@/modules/xp/service";
import {
  CYCLE_DAYS, DEFAULT_AREAS, TO_DB, addDays, checkSlot as fits, fromMinutes, quadrantOf, questionsWith, reviewWindow, rhythmForMinutes, suggestedAreas,
  type Block, type Quadrant, type Rhythm,
} from "./rules";
import { gridSchema, storedAnswersSchema, storedAreasSchema } from "./validation";

const db = () => getPrisma();
const fail = (message: string, code = "INVALID_INPUT", status = 400) => new SquadError(code, status, message);
const newId = (prefix: string) => `${prefix}-${randomUUID().slice(0, 12)}`;
const REVIEW_XP = 40;

type Area = { id: string; name: string; icon: (typeof DEFAULT_AREAS)[number]["icon"] | "spark"; rating: number | null; note: string };
type Grid = z.infer<typeof gridSchema>;
type GridAction = Grid["actions"][number];

async function userToday(userId: string): Promise<string> {
  const profile = await db().userProfile.findUnique({ where: { userId }, select: { timezone: true } });
  return localDateInTimezone(new Date(), profile?.timezone || "UTC");
}

// ---------------------------------------------------------------- load & save

async function load(userId: string) {
  const row = await db().growthStudio.findUnique({ where: { userId } });
  const areas = storedAreasSchema.safeParse(row?.areas);
  const answers = storedAnswersSchema.safeParse(row?.answers);
  const grid = row?.grid ? gridSchema.safeParse(row.grid) : null;
  return {
    areas: (areas.success ? areas.data : DEFAULT_AREAS.map((area) => ({ ...area, rating: null, note: "" }))) as Area[],
    answers: answers.success ? answers.data : {},
    lastPausedAreaId: row?.lastPausedAreaId ?? null,
    grid: grid?.success ? grid.data : null,
    cycleStartedAt: row?.cycleStartedAt ?? new Date(),
  };
}

type State = Awaited<ReturnType<typeof load>>;

async function save(userId: string, state: State) {
  const data = {
    areas: state.areas as unknown as Prisma.InputJsonValue,
    answers: state.answers as Prisma.InputJsonValue,
    lastPausedAreaId: state.lastPausedAreaId,
    grid: state.grid ? (state.grid as unknown as Prisma.InputJsonValue) : undefined,
  };
  await db().growthStudio.upsert({ where: { userId }, create: { userId, ...data, cycleStartedAt: state.cycleStartedAt }, update: data });
}

async function view(userId: string, state?: State) {
  const current = state ?? (await load(userId));
  let grid = current.grid;
  // A grid whose goal was deleted or archived keeps its areas but loses the link.
  if (grid?.goalId) {
    try {
      await accessibleGoal(grid.goalId, userId);
    } catch {
      grid = { ...grid, goalId: "", goalTitle: "" };
    }
  }
  const today = await userToday(userId);
  const window = reviewWindow(current.cycleStartedAt.toISOString().slice(0, 10), today);
  const saved = await db().growthReview.findUnique({ where: { userId_cycle: { userId, cycle: window.cycle } }, select: { finishedAt: true } });
  return {
    areas: current.areas,
    questions: questionsWith(current.answers),
    lastPausedAreaId: current.lastPausedAreaId,
    // The link to the created task or habit is internal; the app doesn't need it.
    grid: grid ? { ...grid, actions: grid.actions.map((action) => ({ ...action, linkedId: undefined })) } : null,
    suggestedAreas: suggestedAreas(current.answers),
    reviewOpensInDays: window.opensInDays || (saved?.finishedAt ? window.nextEndsInDays : 0),
  };
}

export async function getGrowthStudio(userId: string) {
  return view(userId);
}

export async function answeredReflections(userId: string): Promise<number> {
  const { answers } = await load(userId);
  return Object.values(answers).filter((answer) => answer.trim().length > 0).length;
}

// ---------------------------------------------------------------- life audit

/** Ratings are 1–5 or skipped; notes stay private. There's never an overall score. */
export async function rateArea(userId: string, areaId: string, rating: number | null, note: string) {
  const state = await load(userId);
  if (!state.areas.some((area) => area.id === areaId)) throw fail("That area isn’t in your audit.", "NOT_FOUND", 404);
  state.areas = state.areas.map((area) => (area.id === areaId ? { ...area, rating, note } : area));
  state.lastPausedAreaId = state.areas.find((area) => area.rating === null && area.id !== areaId)?.id ?? null;
  await save(userId, state);
  return view(userId, state);
}

export async function saveAuditAreas(userId: string, areas: { id: string | null; name: string }[]) {
  const state = await load(userId);
  const cleaned = areas.filter((area) => area.name.length >= 2);
  if (cleaned.length === 0) throw fail("Keep at least one area.");
  state.areas = cleaned.map((area) => {
    const existing = area.id ? state.areas.find((item) => item.id === area.id) : undefined;
    return existing ? { ...existing, name: area.name } : { id: newId("area"), name: area.name, icon: "spark" as const, rating: null, note: "" };
  });
  await save(userId, state);
  return view(userId, state);
}

export async function answerQuestion(userId: string, questionId: string, answer: string) {
  if (!questionsWith({}).some((question) => question.id === questionId)) throw fail("Unknown question.", "NOT_FOUND", 404);
  const state = await load(userId);
  state.answers = { ...state.answers, [questionId]: answer };
  await save(userId, state);
  return view(userId, state);
}

// ---------------------------------------------------------------- grid

/** Point the grid at one of the person's goals, or a new one created through the normal goals store. */
export async function setCentralGoal(userId: string, input: { goalId: string | null; newTitle?: string; why: string; keepGrid?: boolean }) {
  const state = await load(userId);
  let goal: { id: string; title: string };
  if (input.goalId) {
    goal = await accessibleGoal(input.goalId, userId, true);
    if (input.why) await updateWhy(userId, goal.id, input.why);
  } else {
    if (!input.newTitle) throw fail("Pick a goal or name a new one.");
    goal = await createGoal(userId, { title: input.newTitle, ...(input.why ? { why: input.why } : {}) });
  }
  state.grid = state.grid && (state.grid.goalId === goal.id || input.keepGrid)
    ? { ...state.grid, goalId: goal.id, goalTitle: goal.title, why: input.why || state.grid.why }
    : { goalId: goal.id, goalTitle: goal.title, why: input.why, areas: [], actions: [] };
  await save(userId, state);
  return view(userId, state);
}

async function updateWhy(userId: string, goalId: string, why: string) {
  await db().goal.updateMany({ where: { id: goalId, ownerId: userId }, data: { why } });
}

function needGrid(state: State): Grid {
  if (!state.grid) throw fail("Choose a central goal first.", "NO_GRID", 409);
  return state.grid;
}

export async function applySuggestedGrid(userId: string, blank: boolean) {
  const state = await load(userId);
  const grid = needGrid(state);
  const names = blank ? Array.from({ length: 8 }, (_, index) => `Area ${index + 1}`) : suggestedAreas(state.answers).map((area) => area.name);
  state.grid = { ...grid, areas: names.map((name) => ({ id: newId("a"), name, isDraft: true })), actions: grid.actions.filter((action) => action.status === "accepted") };
  await save(userId, state);
  return view(userId, state);
}

export async function renameGridArea(userId: string, areaId: string, name: string) {
  const state = await load(userId);
  const grid = needGrid(state);
  if (!grid.areas.some((area) => area.id === areaId)) throw fail("That area isn’t in your grid.", "NOT_FOUND", 404);
  state.grid = { ...grid, areas: grid.areas.map((area) => (area.id === areaId ? { ...area, name, isDraft: false } : area)) };
  await save(userId, state);
  return view(userId, state);
}

export async function saveGridAction(userId: string, input: { id: string | null; areaId: string; title: string; minutes: number; addAs: "task" | "habit"; rhythm: Rhythm }) {
  const state = await load(userId);
  const grid = needGrid(state);
  if (!grid.areas.some((area) => area.id === input.areaId)) throw fail("That area isn’t in your grid.", "NOT_FOUND", 404);
  const existing = input.id ? grid.actions.find((action) => action.id === input.id) : undefined;
  if (input.id && !existing) throw fail("That action isn’t in your grid any more.", "NOT_FOUND", 404);
  if (existing?.status === "accepted") throw fail("This one is already in your plan. Change it there.", "ALREADY_ACCEPTED", 409);
  if (!existing && grid.actions.filter((action) => action.areaId === input.areaId).length >= 8) throw fail("An area holds up to 8 actions.", "LIMIT_REACHED", 409);
  const id = existing?.id ?? newId("ga");
  const action: GridAction = {
    id, areaId: input.areaId, title: input.title, minutes: input.minutes, addAs: input.addAs, rhythm: input.rhythm, status: "draft",
    rhythmChangedByYou: existing ? existing.rhythm !== input.rhythm || existing.rhythmChangedByYou : false, linkedId: null,
  };
  state.grid = {
    ...grid,
    areas: grid.areas.map((area) => (area.id === input.areaId ? { ...area, isDraft: false } : area)),
    actions: existing ? grid.actions.map((item) => (item.id === id ? action : item)) : [...grid.actions, action],
  };
  await save(userId, state);
  return { state: await view(userId, state), actionId: id };
}

export async function setActionRhythm(userId: string, actionId: string, rhythm: Rhythm) {
  const state = await load(userId);
  const grid = needGrid(state);
  state.grid = {
    ...grid,
    actions: grid.actions.map((action) =>
      action.id === actionId && action.status !== "accepted"
        ? { ...action, rhythm, addAs: rhythm === "daily" && action.minutes <= 30 ? "habit" : "task", rhythmChangedByYou: rhythm !== rhythmForMinutes(action.minutes) }
        : action,
    ),
  };
  await save(userId, state);
  return view(userId, state);
}

/**
 * Accept a draft into the real plan, once: a task goes to the Planner (linked to the goal when it can be),
 * a habit to Habits. Accepting twice never duplicates it.
 */
export async function acceptGridAction(userId: string, actionId: string, as: "task" | "habit", habit?: { days: number[]; targetMinutes: number; reminderTime: string | null }) {
  const state = await load(userId);
  const grid = needGrid(state);
  const action = grid.actions.find((item) => item.id === actionId);
  if (!action) throw fail("That action isn’t in your grid any more.", "NOT_FOUND", 404);
  if (action.status === "accepted") return view(userId, state);
  let goal: { id: string; squadId: string | null } | null = null;
  if (grid.goalId) {
    try { goal = await accessibleGoal(grid.goalId, userId, true); } catch { goal = null; }
  }
  const today = await userToday(userId);
  let linkedId: string;
  if (as === "habit") {
    const minutes = habit?.targetMinutes ?? action.minutes;
    const created = await createHabit(userId, {
      name: action.title, targetType: "DURATION", targetValue: minutes, unit: "min",
      scheduleDays: [...new Set(habit?.days ?? [0, 1, 2, 3, 4, 5, 6])].sort(),
      ...(habit?.reminderTime ? { reminderTime: habit.reminderTime } : {}),
      ...(goal && !goal.squadId ? { goalId: goal.id } : {}),
    });
    linkedId = created.id;
  } else {
    const created = await createTask(userId, {
      title: action.title, durationMin: action.minutes, priority: "MEDIUM", visibility: "PRIVATE",
      dueDate: action.rhythm === "daily" || action.rhythm === "once" ? today : addDays(today, 1),
      ...(goal && !goal.squadId ? { goalId: goal.id } : {}),
    });
    linkedId = created.id;
  }
  // Re-read in case another accept landed meanwhile, then mark this one accepted.
  const fresh = await load(userId);
  const freshGrid = needGrid(fresh);
  fresh.grid = { ...freshGrid, actions: freshGrid.actions.map((item) => (item.id === actionId ? { ...item, status: "accepted", addAs: as, linkedId } : item)) };
  await save(userId, fresh);
  return view(userId, fresh);
}

export async function acceptAllRhythms(userId: string) {
  const state = await load(userId);
  const pending = needGrid(state).actions.filter((action) => action.status !== "accepted");
  for (const action of pending) {
    await acceptGridAction(userId, action.id, action.rhythm === "daily" && action.addAs === "habit" ? "habit" : "task");
  }
  return view(userId);
}

// ---------------------------------------------------------------- scheduler (Make room)

async function linkedTaskIds(userId: string): Promise<Set<string>> {
  const { grid } = await load(userId);
  return new Set((grid?.actions ?? []).flatMap((action) => (action.status === "accepted" && action.addAs === "task" && action.linkedId ? [action.linkedId] : [])));
}

type OpenTask = { id: string; title: string; durationMin: number | null; dueDate: Date | null; dueTime: string | null; priority: string; quadrant: string | null; goal: { title: string } | null };

function itemOf(task: OpenTask, today: string, fromStudio: Set<string>) {
  const minutes = task.durationMin ?? 20;
  const date = task.dueDate ? task.dueDate.toISOString().slice(0, 10) : null;
  return {
    taskId: task.id,
    title: task.title,
    minutes,
    detail: task.dueTime ? [task.dueTime, `${minutes} min`, date && date !== today ? date : "today"].join(" · ") : "Accepted · unscheduled",
    quadrant: quadrantOf(task),
    time: task.dueTime,
    scheduledDate: date,
    repeatsDaily: false,
    goalName: task.goal?.title ?? null,
    priority: (task.priority === "HIGH" ? "high" : task.priority === "LOW" ? "low" : "medium") as "high" | "medium" | "low",
    fromGrowthStudio: fromStudio.has(task.id),
  };
}

const openTaskSelect = { id: true, title: true, durationMin: true, dueDate: true, dueTime: true, priority: true, quadrant: true, goal: { select: { title: true } } } as const;

export async function getScheduler(userId: string) {
  const [tasks, today, fromStudio, state] = await Promise.all([
    db().task.findMany({ where: { ownerId: userId, archivedAt: null, completions: { none: {} } }, select: openTaskSelect, orderBy: { createdAt: "asc" }, take: 300 }),
    userToday(userId),
    linkedTaskIds(userId),
    load(userId),
  ]);
  const drafts = (state.grid?.actions ?? [])
    .filter((action) => action.status !== "accepted")
    .map((action) => ({ id: action.id, title: action.title, area: state.grid?.areas.find((area) => area.id === action.areaId)?.name ?? "" }));
  return { items: tasks.map((task) => itemOf(task, today, fromStudio)), drafts };
}

/** Moving between boxes only changes the label; nothing is rescheduled. */
export async function setQuadrant(userId: string, taskId: string, quadrant: Quadrant) {
  await updateTask(taskId, userId, { quadrant: TO_DB[quadrant] });
  const task = await db().task.findUniqueOrThrow({ where: { id: taskId }, select: openTaskSelect });
  return itemOf(task, await userToday(userId), await linkedTaskIds(userId));
}

async function blocksOn(userId: string, dateIso: string, excludeTaskId: string | null): Promise<Block[]> {
  const tasks = await db().task.findMany({
    where: { ownerId: userId, archivedAt: null, dueDate: new Date(`${dateIso}T00:00:00.000Z`), dueTime: { not: null }, completions: { none: {} }, ...(excludeTaskId ? { id: { not: excludeTaskId } } : {}) },
    select: { title: true, dueTime: true, durationMin: true },
    take: 100,
  });
  return tasks
    .flatMap((task) => (task.dueTime ? [{ title: task.title, from: task.dueTime, to: fromMinutes(Number(task.dueTime.slice(0, 2)) * 60 + Number(task.dueTime.slice(3, 5)) + (task.durationMin ?? 20)) }] : []))
    .sort((a, b) => a.from.localeCompare(b.from));
}

export async function getBusy(userId: string, dateIso: string, taskId: string | null) {
  if (taskId) await accessibleTask(taskId, userId);
  return blocksOn(userId, dateIso, taskId);
}

/** Days in a month that already have timed plans, for the dots on the calendar. */
export async function getBusyDays(userId: string, year: number, month: number) {
  const from = new Date(Date.UTC(year, month, 1));
  const to = new Date(Date.UTC(year, month + 1, 1));
  const rows = await db().task.findMany({
    where: { ownerId: userId, archivedAt: null, dueTime: { not: null }, dueDate: { gte: from, lt: to }, completions: { none: {} } },
    select: { dueDate: true },
    take: 500,
  });
  return [...new Set(rows.flatMap((row) => (row.dueDate ? [row.dueDate.toISOString().slice(0, 10)] : [])))].sort();
}

async function ownTask(userId: string, taskId: string) {
  const task = await accessibleTask(taskId, userId);
  if (task.ownerId !== userId) throw fail("Only the creator can schedule this task.", "FORBIDDEN", 403);
  return task;
}

export async function checkSlot(userId: string, taskId: string, dateIso: string, time: string) {
  const task = await ownTask(userId, taskId);
  return fits(await blocksOn(userId, dateIso, taskId), time, task.durationMin ?? 20);
}

/** Give a task a day and time, checked again here so a stale screen can't double-book. Never in the past. */
export async function scheduleTask(userId: string, taskId: string, input: { date: string; time: string; repeatsDaily: boolean }) {
  const task = await ownTask(userId, taskId);
  const today = await userToday(userId);
  if (input.date < today) throw fail("Pick today or a later day.");
  if (input.repeatsDaily) throw fail("Repeating tasks aren’t available yet. Schedule it for one day, or make it a habit.", "NOT_SUPPORTED", 400);
  const result = fits(await blocksOn(userId, input.date, taskId), input.time, task.durationMin ?? 20);
  if (!result.ok) throw fail(result.reason === "conflict" ? `That overlaps ${result.conflict?.title}.` : "Use a 24-hour time, like 17:30.", "SLOT_TAKEN", 409);
  await updateTask(taskId, userId, { dueDate: input.date, dueTime: input.time, quadrant: "DO" });
  const updated = await db().task.findUniqueOrThrow({ where: { id: taskId }, select: openTaskSelect });
  return itemOf(updated, today, await linkedTaskIds(userId));
}

// ---------------------------------------------------------------- 15-day review

type Change = { id: string; kind: "keep" | "smaller" | "new"; title: string; detail: string; draftActionId?: string | null };

async function reviewFacts(userId: string, from: string, to: string, state: State) {
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${addDays(to, 1)}T00:00:00.000Z`);
  const accepted = (state.grid?.actions ?? []).filter((action) => action.status === "accepted" && action.linkedId);
  const [completions, logs, focus, xp] = await Promise.all([
    db().taskCompletion.findMany({ where: { userId, occurrenceDate: { gte: start, lt: end } }, select: { taskId: true, occurrenceDate: true }, take: 5000 }),
    db().habitLog.findMany({ where: { userId, date: { gte: start, lt: end }, value: { gt: 0 } }, select: { habitId: true, date: true }, take: 5000 }),
    db().focusSession.findMany({ where: { userId, endedAt: { gte: start, lt: end }, focusedSeconds: { gte: 60 } }, select: { endedAt: true }, take: 5000 }),
    db().xpEvent.aggregate({ where: { userId, createdAt: { gte: start, lt: end }, amount: { gt: 0 } }, _sum: { amount: true } }),
  ]);
  const day = (date: Date) => date.toISOString().slice(0, 10);
  const daysActive = new Set([...completions.map((row) => day(row.occurrenceDate)), ...logs.map((row) => day(row.date)), ...focus.flatMap((row) => (row.endedAt ? [day(row.endedAt)] : []))]).size;
  const daysFor = (action: GridAction) =>
    action.addAs === "task"
      ? new Set(completions.filter((row) => row.taskId === action.linkedId).map((row) => day(row.occurrenceDate))).size
      : new Set(logs.filter((row) => row.habitId === action.linkedId).map((row) => day(row.date))).size;
  const counted = accepted.map((action) => ({ action, days: daysFor(action) }));
  const tried = counted.filter((item) => item.days > 0).sort((a, b) => b.days - a.days);
  const notTried = counted.filter((item) => item.days === 0);
  return {
    stats: { tried: tried.length, total: accepted.length, daysActive, xpEarned: xp._sum.amount ?? 0 },
    tried: tried.map((item) => ({ title: item.action.title, detail: `${item.days} of ${CYCLE_DAYS} days` })),
    notTried: notTried.map((item) => ({ title: item.action.title, detail: item.action.rhythm[0]?.toUpperCase() + item.action.rhythm.slice(1) })),
    suggestions: [
      ...tried.slice(0, 1).map((item) => ({ id: "rc-keep", kind: "keep" as const, title: item.action.title, detail: `${item.action.minutes} min. The routine that helped.` })),
      ...tried.slice(-1).filter((item) => tried.length > 1 && item.action.minutes >= 10).map((item) => ({ id: "rc-smaller", kind: "smaller" as const, title: `${item.action.title.replace(/\d+\s*min(utes)?/i, "").trim()} · ${Math.max(5, Math.round(item.action.minutes / 2))} min`, detail: "A smaller version for busy days" })),
      ...notTried.slice(0, 1).map((item) => ({ id: "rc-new", kind: "new" as const, title: item.action.title, detail: "A draft change, not a new task yet" })),
    ] as Change[],
  };
}

export async function getReview(userId: string) {
  const [state, today] = await Promise.all([load(userId), userToday(userId)]);
  const window = reviewWindow(state.cycleStartedAt.toISOString().slice(0, 10), today);
  const [facts, saved] = await Promise.all([
    reviewFacts(userId, window.from, window.to, state),
    db().growthReview.findUnique({ where: { userId_cycle: { userId, cycle: window.cycle } } }),
  ]);
  const savedChanges = saved ? (saved.changes as Change[]) : null;
  return {
    cycle: window.cycle, from: window.from, to: window.to,
    status: saved?.finishedAt ? ("saved" as const) : ("open" as const),
    stats: facts.stats, tried: facts.tried, notTried: facts.notTried,
    obstacles: saved?.obstacles ?? [], context: saved?.context ?? "",
    suggestions: savedChanges ?? facts.suggestions,
    xpAwarded: saved?.finishedAt ? REVIEW_XP : 0,
    nextFrom: window.nextFrom, nextTo: window.nextTo,
  };
}

/**
 * Save the review (XP once per cycle). "Smaller" and "new" changes become grid drafts;
 * nothing reaches the plan until accepted. Past days are never rewritten.
 */
export async function saveReview(userId: string, input: { obstacles: string[]; context: string; changes: Change[]; finish: boolean }) {
  const [state, today] = await Promise.all([load(userId), userToday(userId)]);
  const window = reviewWindow(state.cycleStartedAt.toISOString().slice(0, 10), today);
  if (window.opensInDays > 0) throw fail("Your first review opens after 15 days.", "NOT_OPEN", 409);
  const existing = await db().growthReview.findUnique({ where: { userId_cycle: { userId, cycle: window.cycle } } });
  let changes = input.changes.filter((change) => change.title.length >= 2);
  const finishing = input.finish && !existing?.finishedAt;
  if (finishing && state.grid) {
    const grid = state.grid;
    const areaId = grid.areas.find((area) => !area.isDraft)?.id ?? grid.areas[0]?.id;
    const added: GridAction[] = [];
    changes = changes.map((change) => {
      if (change.kind === "keep" || !areaId) return change;
      const minutes = Number(change.title.match(/(\d+)\s*min/)?.[1] ?? 20);
      const action: GridAction = { id: newId("ga"), areaId, title: change.title, minutes: Math.min(600, Math.max(1, minutes)), addAs: "task", rhythm: /weekly/i.test(change.title) ? "weekly" : "daily", status: "draft", rhythmChangedByYou: false, linkedId: null };
      added.push(action);
      return { ...change, draftActionId: action.id };
    });
    state.grid = { ...grid, actions: [...grid.actions, ...added].slice(0, 64) };
    await save(userId, state);
  }
  await db().$transaction(async (tx) => {
    const row = await tx.growthReview.upsert({
      where: { userId_cycle: { userId, cycle: window.cycle } },
      create: { userId, cycle: window.cycle, obstacles: input.obstacles, context: input.context, changes: changes as unknown as Prisma.InputJsonValue, finishedAt: finishing ? new Date() : null },
      update: { obstacles: input.obstacles, context: input.context, changes: changes as unknown as Prisma.InputJsonValue, ...(finishing ? { finishedAt: new Date() } : {}) },
      select: { id: true },
    });
    if (finishing) await appendXp(tx, userId, { source: "REVIEW", sourceId: row.id, key: `review:${window.cycle}`, amount: REVIEW_XP });
  });
  return getReview(userId);
}

