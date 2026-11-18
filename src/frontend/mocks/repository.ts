import { mockCompanion, mockFocusLobby, mockHabits, mockNotifications, mockPlanner, mockSquadMembers, mockTasks, mockWeekFocusedMinutes } from "./data";
import { MOMENT_XP, addDays, currentRun, isScheduledOn, isoDate } from "./habitRules";
import type { CompanionState, ConsistencyMoment, FocusLobby, Habit, HabitTracker, SaveFocusInput, SaveFocusResult, HabitsData, NewHabitInput, NewTaskInput, NotificationItem, PlannerData, PlannerListTask, SquadData, Task, TodayData } from "./types";

const MOCK_LATENCY_MS = 250;
const TASK_COMPLETE_XP = 10;
const HABIT_COMPLETE_XP = 5;

// In-memory mock "server" state. Every mutation below plays the role of a
// backend response: callers only ever see values this module computed, so
// the UI never has to derive XP itself.
let companion: CompanionState = { ...mockCompanion };
let tasks: Task[] = mockTasks.map((task) => ({ ...task }));
let habits: Habit[] = mockHabits.map((habit) => ({ ...habit }));
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const awardedMoments = new Set<string>();

function todayIso(): string {
  return isoDate(new Date());
}

function rules(habit: Habit) {
  return {
    scheduleDays: habit.scheduleDays ?? EVERY_DAY,
    targetCount: habit.targetCount,
    startsOn: habit.startsOn,
    pausedFrom: habit.pausedFrom,
    pausedUntil: habit.pausedUntil,
  };
}

/** Sixty days of believable history, so rhythms, weeks and months have something to show. */
function seedHistory(): Record<string, Record<string, number>> {
  const today = todayIso();
  const history: Record<string, Record<string, number>> = {};
  for (const habit of habits) {
    history[habit.id] = { [today]: habit.completedCount };
    for (let back = 1; back <= 60; back += 1) {
      const iso = addDays(today, -back);
      if (!isScheduledOn(rules(habit), iso)) continue;
      let count = 0;
      if (habit.id === "habit-1") count = back <= 13 || (back !== 14 && back % 5 !== 0) ? 8 : 5;
      else if (habit.id === "habit-2") count = back % 6 === 3 ? 0 : 1;
      else if (habit.id === "habit-3") count = back <= 11 || (back !== 12 && back % 4 !== 0) ? 1 : 0;
      else count = back % 3 === 1 ? 0 : 1;
      history[habit.id][iso] = count;
    }
  }
  return history;
}

let habitHistory = seedHistory();

/** Today's view of a habit, as the server would send it. */
function withToday(habit: Habit): Habit {
  return { ...habit, isScheduledToday: isScheduledOn(rules(habit), todayIso()) };
}

function visibleHabits(): Habit[] {
  return habits.filter((habit) => !habit.archived).map(withToday);
}
const squadMembers = mockSquadMembers.map((member) => ({ ...member }));
let notifications: NotificationItem[] = mockNotifications.map((item) => ({ ...item }));
let planner: PlannerData = structuredClone(mockPlanner);
let weekFocusedMinutes = mockWeekFocusedMinutes;
const savedFocusSessions = new Set<string>();
let nextId = 100;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

function awardXp(amount: number): CompanionState {
  companion = { ...companion, xp: companion.xp + amount };
  return companion;
}

export async function getToday(): Promise<TodayData> {
  return delay({
    date: new Date().toISOString().slice(0, 10),
    companion,
    tasks,
    habits: visibleHabits().filter((habit) => habit.isScheduledToday),
    isCheckInPromptVisible: true,
  });
}

export async function completeTask(
  taskId: string,
): Promise<{ task: Task; companion: CompanionState; xpAwarded: number }> {
  const before = tasks.find((item) => item.id === taskId);
  if (!before) throw new Error(`Unknown task: ${taskId}`);
  if (before.isDone) return delay({ task: before, companion, xpAwarded: 0 });
  tasks = tasks.map((task) => (task.id === taskId ? { ...task, isDone: true } : task));
  const task = { ...before, isDone: true };
  const nextCompanion = awardXp(TASK_COMPLETE_XP);
  return delay({ task, companion: nextCompanion, xpAwarded: TASK_COMPLETE_XP });
}

/** Undo a completion: the server takes back exactly the XP it gave. */
export async function undoCompleteTask(taskId: string): Promise<{ task: Task; companion: CompanionState }> {
  const before = tasks.find((item) => item.id === taskId);
  if (!before) throw new Error(`Unknown task: ${taskId}`);
  if (!before.isDone) return delay({ task: before, companion });
  tasks = tasks.map((task) => (task.id === taskId ? { ...task, isDone: false } : task));
  const nextCompanion = awardXp(-TASK_COMPLETE_XP);
  return delay({ task: { ...before, isDone: false }, companion: nextCompanion });
}

export async function getHabits(): Promise<HabitsData> {
  return delay({ habits: visibleHabits() });
}

export async function getHabitTracker(): Promise<HabitTracker> {
  const today = todayIso();
  const list = visibleHabits();
  const rhythms = Object.fromEntries(list.map((habit) => [habit.id, currentRun(rules(habit), habitHistory[habit.id] ?? {}, today)]));
  return delay({ todayIso: today, habits: list, history: structuredClone(habitHistory), rhythms });
}

export async function incrementHabit(
  habitId: string,
): Promise<{ habit: Habit; companion: CompanionState; moment: ConsistencyMoment | null }> {
  const before = habits.find((item) => item.id === habitId);
  if (!before) throw new Error(`Unknown habit: ${habitId}`);
  const today = todayIso();
  const scheduled = isScheduledOn(rules(before), today);
  // Nothing to log past the target, or on a day the habit does not ask for: no XP either.
  if (!scheduled || before.completedCount >= before.targetCount) {
    return delay({ habit: withToday(before), companion, moment: null });
  }
  const updated = { ...before, completedCount: before.completedCount + 1 };
  habits = habits.map((habit) => (habit.id === habitId ? updated : habit));
  habitHistory = { ...habitHistory, [habitId]: { ...(habitHistory[habitId] ?? {}), [today]: updated.completedCount } };
  let nextCompanion = awardXp(HABIT_COMPLETE_XP);

  let moment: ConsistencyMoment | null = null;
  if (updated.completedCount === updated.targetCount) {
    const days = currentRun(rules(updated), habitHistory[habitId], today);
    const momentKey = `${habitId}:${days}:${today}`;
    if (MOMENT_XP[days] && !awardedMoments.has(momentKey)) {
      awardedMoments.add(momentKey);
      nextCompanion = awardXp(MOMENT_XP[days]);
      moment = { habitId, habitName: updated.name, days, xpAwarded: MOMENT_XP[days] };
    }
  }
  return delay({ habit: withToday(updated), companion: nextCompanion, moment });
}

export interface HabitChanges {
  scheduleDays?: number[];
  targetCount?: number;
}

/** Schedule and target changes apply from tomorrow; history stays as it was. */
export async function updateHabit(habitId: string, changes: HabitChanges): Promise<Habit> {
  const before = habits.find((item) => item.id === habitId);
  if (!before) throw new Error(`Unknown habit: ${habitId}`);
  const scheduleDays = changes.scheduleDays?.filter((day) => day >= 0 && day <= 6);
  const updated: Habit = {
    ...before,
    scheduleDays: scheduleDays && scheduleDays.length ? [...new Set(scheduleDays)].sort((a, b) => a - b) : before.scheduleDays,
    targetCount: changes.targetCount && changes.targetCount > 0 ? Math.min(999, Math.round(changes.targetCount)) : before.targetCount,
  };
  // Today keeps the plan it started with.
  if (updated.targetCount !== before.targetCount) updated.completedCount = Math.min(before.completedCount, updated.targetCount);
  habits = habits.map((habit) => (habit.id === habitId ? updated : habit));
  return delay(withToday(updated));
}

/** Pause from tomorrow. `weeks: null` pauses until resumed. Past days are untouched. */
export async function pauseHabit(habitId: string, weeks: number | null): Promise<Habit> {
  const before = habits.find((item) => item.id === habitId);
  if (!before) throw new Error(`Unknown habit: ${habitId}`);
  const from = addDays(todayIso(), 1);
  const updated: Habit = { ...before, pausedFrom: from, pausedUntil: weeks ? addDays(from, weeks * 7 - 1) : null };
  habits = habits.map((habit) => (habit.id === habitId ? updated : habit));
  return delay(withToday(updated));
}

export async function resumeHabit(habitId: string): Promise<Habit> {
  const before = habits.find((item) => item.id === habitId);
  if (!before) throw new Error(`Unknown habit: ${habitId}`);
  const updated: Habit = { ...before, pausedFrom: null, pausedUntil: null };
  habits = habits.map((habit) => (habit.id === habitId ? updated : habit));
  return delay(withToday(updated));
}

/** Archive stops the habit and keeps every day of its history. */
export async function archiveHabit(habitId: string): Promise<void> {
  habits = habits.map((habit) => (habit.id === habitId ? { ...habit, archived: true } : habit));
  return delay(undefined);
}

export async function getSquad(): Promise<SquadData> {
  return delay({ hasSquad: squadMembers.length > 0, members: squadMembers });
}

export async function addTask(input: NewTaskInput): Promise<{ task: Task }> {
  const isShared = input.shareWithSquad === true;
  const task: Task = {
    id: `task-${nextId++}`,
    title: input.title.trim(),
    isDone: false,
    isShared,
    sharedByName: isShared ? planner.squadName : undefined,
    durationMinutes: input.durationMinutes,
    category: input.category,
    goalName: input.goalName,
    priority: input.priority,
  };
  const when = input.when ?? "today";
  if (when === "today") {
    tasks = [...tasks, task];
  } else {
    const listTask: PlannerListTask = {
      id: task.id,
      title: task.title,
      detail: when === "tomorrow" ? "Tomorrow" : when === "noDate" ? "No date" : "Date to pick",
      group: when === "tomorrow" ? "thisWeek" : "later",
      isDone: false,
      isShared,
      hasDate: when !== "noDate",
      badge: isShared ? "Shared" : input.priority === "high" ? "P1" : undefined,
    };
    planner = { ...planner, allTasks: [...planner.allTasks, listTask] };
  }
  return delay({ task });
}

export async function getPlanner(): Promise<PlannerData> {
  return delay(planner);
}

/** "Move to today" for yesterday's leftover: it joins today's list, no penalty. */
export async function moveCarryOverToToday(): Promise<{ task: Task | null; planner: PlannerData }> {
  const carry = planner.carryOver;
  if (!carry) return delay({ task: null, planner });
  const task: Task = { id: `task-${nextId++}`, title: carry.title, isDone: false, isShared: false, time: "13:00" };
  tasks = [...tasks, task];
  planner = { ...planner, carryOver: null };
  return delay({ task, planner });
}

/** Pull a task from the full list into today. Its record stays; only its day changes. */
export async function moveListTaskToToday(listTaskId: string): Promise<{ task: Task | null; planner: PlannerData }> {
  const item = planner.allTasks.find((entry) => entry.id === listTaskId);
  if (!item) return delay({ task: null, planner });
  const task: Task = { id: `task-${nextId++}`, title: item.title, isDone: false, isShared: item.isShared, time: "13:00" };
  tasks = [...tasks, task];
  planner = { ...planner, allTasks: planner.allTasks.filter((entry) => entry.id !== listTaskId) };
  return delay({ task, planner });
}

export async function rescheduleCarryOver(): Promise<PlannerData> {
  const carry = planner.carryOver;
  if (!carry) return delay(planner);
  planner = {
    ...planner,
    carryOver: null,
    allTasks: [
      ...planner.allTasks,
      { id: carry.id, title: carry.title, detail: "Date to pick", group: "later", isDone: false, isShared: false, hasDate: false },
    ],
  };
  return delay(planner);
}

export async function addHabit(input: NewHabitInput): Promise<{ habit: Habit }> {
  const kind = input.kind ?? (input.targetCount > 1 ? "target" : "tick");
  const scheduleDays = input.scheduleDays?.filter((day) => day >= 0 && day <= 6) ?? [];
  const habit: Habit = {
    id: `habit-${nextId++}`,
    kind,
    unit: input.unit?.trim() || (kind === "timer" ? "min" : undefined),
    scheduleDays: scheduleDays.length ? [...new Set(scheduleDays)].sort((a, b) => a - b) : EVERY_DAY,
    startsOn: input.startsTomorrow ? addDays(todayIso(), 1) : undefined,
    reminderTime: input.reminderTime ?? null,
    goalName: input.goalName ?? null,
    shareWithSquad: input.shareWithSquad === true,
    name: input.name.trim(),
    targetCount: Math.max(1, input.targetCount),
    completedCount: 0,
    isScheduledToday: true,
    icon: "sparkle",
  };
  habits = [...habits, habit];
  habitHistory = { ...habitHistory, [habit.id]: {} };
  return delay({ habit: withToday(habit) });
}

export async function getNotifications(): Promise<NotificationItem[]> {
  return delay(notifications);
}

export async function markAllNotificationsRead(): Promise<NotificationItem[]> {
  notifications = notifications.map((item) => ({ ...item, isRead: true }));
  return delay(notifications);
}

/** Server rule (mock): one XP for every started five minutes of real focus, none under a minute. */
function focusXpFor(focusedSeconds: number): number {
  if (focusedSeconds < 60) return 0;
  return Math.ceil(focusedSeconds / 60 / 5);
}

/** What saving this much focus would earn, for the finish-early question. Server-side rule. */
export async function quoteFocusXp(focusedSeconds: number): Promise<number> {
  return delay(focusXpFor(Math.max(0, Math.floor(focusedSeconds))));
}

export async function getFocusLobby(): Promise<FocusLobby> {
  return delay(mockFocusLobby);
}

/**
 * Save a finished or stopped session. `sessionKey` makes retries safe: saving
 * the same session twice (e.g. after a timeout or an offline retry) awards XP once.
 */
export async function saveFocusSession(sessionKey: string, input: SaveFocusInput): Promise<SaveFocusResult> {
  const focusedSeconds = Math.max(0, Math.min(Math.floor(input.focusedSeconds), input.plannedMinutes * 60));
  if (savedFocusSessions.has(sessionKey)) {
    return delay({ focusedSeconds, xpAwarded: 0, weekFocusedMinutes, companion });
  }
  savedFocusSessions.add(sessionKey);
  const xpAwarded = focusXpFor(focusedSeconds);
  weekFocusedMinutes += Math.round(focusedSeconds / 60);
  const nextCompanion = awardXp(xpAwarded);
  return delay({ focusedSeconds, xpAwarded, weekFocusedMinutes, companion: nextCompanion });
}
