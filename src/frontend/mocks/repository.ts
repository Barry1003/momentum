import { mockCompanion, mockFocusLobby, mockHabits, mockNotifications, mockPlanner, mockSquadMembers, mockTasks, mockWeekFocusedMinutes } from "./data";
import type { CompanionState, FocusLobby, Habit, SaveFocusInput, SaveFocusResult, HabitsData, NewHabitInput, NewTaskInput, NotificationItem, PlannerData, PlannerListTask, SquadData, Task, TodayData } from "./types";

const MOCK_LATENCY_MS = 250;
const TASK_COMPLETE_XP = 10;
const HABIT_COMPLETE_XP = 5;

// In-memory mock "server" state. Every mutation below plays the role of a
// backend response: callers only ever see values this module computed, so
// the UI never has to derive XP itself.
let companion: CompanionState = { ...mockCompanion };
let tasks: Task[] = mockTasks.map((task) => ({ ...task }));
let habits: Habit[] = mockHabits.map((habit) => ({ ...habit }));
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
    habits,
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
  return delay({ habits });
}

export async function incrementHabit(habitId: string): Promise<{ habit: Habit; companion: CompanionState }> {
  habits = habits.map((habit) =>
    habit.id === habitId
      ? { ...habit, completedCount: Math.min(habit.targetCount, habit.completedCount + 1) }
      : habit,
  );
  const habit = habits.find((item) => item.id === habitId);
  if (!habit) throw new Error(`Unknown habit: ${habitId}`);
  const nextCompanion = awardXp(HABIT_COMPLETE_XP);
  return delay({ habit, companion: nextCompanion });
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
  const habit: Habit = {
    id: `habit-${nextId++}`,
    name: input.name.trim(),
    targetCount: Math.max(1, input.targetCount),
    completedCount: 0,
    isScheduledToday: true,
    icon: "sparkle",
  };
  habits = [...habits, habit];
  return delay({ habit });
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
