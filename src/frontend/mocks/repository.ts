import { mockCompanion, mockHabits, mockNotifications, mockSquadMembers, mockTasks } from "./data";
import type { CompanionState, Habit, HabitsData, NewHabitInput, NewTaskInput, NotificationItem, SquadData, Task, TodayData } from "./types";

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

export async function completeTask(taskId: string): Promise<{ task: Task; companion: CompanionState }> {
  tasks = tasks.map((task) => (task.id === taskId ? { ...task, isDone: true } : task));
  const task = tasks.find((item) => item.id === taskId);
  if (!task) throw new Error(`Unknown task: ${taskId}`);
  const nextCompanion = awardXp(TASK_COMPLETE_XP);
  return delay({ task, companion: nextCompanion });
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
  const task: Task = {
    id: `task-${nextId++}`,
    title: input.title.trim(),
    isDone: false,
    isShared: false,
    durationMinutes: input.durationMinutes,
    category: input.category,
  };
  tasks = [...tasks, task];
  return delay({ task });
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
