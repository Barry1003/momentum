import { isScheduledOn, type HabitRuleInput } from "@/frontend/mocks/habitRules";

export const MAX_RANGE_DAYS = 366;

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function datesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  for (let iso = from; iso <= to && dates.length < MAX_RANGE_DAYS; iso = addDays(iso, 1)) dates.push(iso);
  return dates;
}

/** Order the range, never go past today, and keep it to a year. */
export function clampRange(fromIso: string | null, toIso: string | null, today: string): { from: string; to: string } {
  const valid = (value: string | null): value is string => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
  let to = valid(toIso) ? toIso : today;
  let from = valid(fromIso) ? fromIso : to;
  if (from > to) [from, to] = [to, from];
  if (to > today) to = today;
  if (from > to) from = to;
  if (datesBetween(from, to).length >= MAX_RANGE_DAYS) from = addDays(to, -(MAX_RANGE_DAYS - 1));
  return { from, to };
}

export interface ProgressHabit extends HabitRuleInput {
  id: string;
  name: string;
  icon: "water" | "move" | "read" | "sparkle";
  /** date → value logged that day */
  history: Record<string, number>;
}

export interface ProgressGoal {
  id: string;
  title: string;
  isPaused: boolean;
}

export interface ProgressInput {
  focusByDay: Record<string, number>;
  tasksByDay: Record<string, number>;
  habits: ProgressHabit[];
  goals: ProgressGoal[];
  /** goalId → date → tasks done / focus minutes */
  goalTasksByDay: Record<string, Record<string, number>>;
  goalFocusByDay: Record<string, Record<string, number>>;
}

const sumDays = (byDay: Record<string, number> | undefined, dates: string[]) => dates.reduce((sum, iso) => sum + (byDay?.[iso] ?? 0), 0);

export function summarise(input: ProgressInput, from: string, to: string) {
  const dates = datesBetween(from, to);
  const habitRows = input.habits.map((habit) => {
    const scheduledDays = dates.filter((iso) => isScheduledOn(habit, iso));
    const met = scheduledDays.filter((iso) => (habit.history[iso] ?? 0) >= habit.targetCount).length;
    return { id: habit.id, name: habit.name, icon: habit.icon, met, scheduled: scheduledDays.length };
  });
  const scheduled = habitRows.reduce((sum, row) => sum + row.scheduled, 0);
  const met = habitRows.reduce((sum, row) => sum + row.met, 0);
  const activeDays = dates.filter((iso) => (input.focusByDay[iso] ?? 0) > 0 || (input.tasksByDay[iso] ?? 0) > 0 || input.habits.some((habit) => (habit.history[iso] ?? 0) > 0)).length;
  return {
    from,
    to,
    activeDays,
    focusMinutes: sumDays(input.focusByDay, dates),
    tasksDone: sumDays(input.tasksByDay, dates),
    habitsKeptPercent: scheduled ? Math.round((met / scheduled) * 100) : 0,
    focusByDay: dates.slice(-7).map((iso) => ({ iso, minutes: input.focusByDay[iso] ?? 0 })),
    habits: habitRows,
    byGoal: input.goals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      tasksDone: sumDays(input.goalTasksByDay[goal.id], dates),
      focusMinutes: sumDays(input.goalFocusByDay[goal.id], dates),
      isPaused: goal.isPaused,
    })),
  };
}

/** The full Progress summary: totals, change against the period before, and the best week. */
export function progressSummary(input: ProgressInput, from: string, to: string) {
  const current = summarise(input, from, to);
  const length = datesBetween(from, to).length;
  const before = summarise(input, addDays(from, -length), addDays(from, -1));
  let bestWeek: { from: string; to: string; activeDays: number } | null = null;
  if (length >= 14) {
    for (let start = from; start <= to; start = addDays(start, 7)) {
      const end = addDays(start, 6) > to ? to : addDays(start, 6);
      const week = summarise(input, start, end);
      if (!bestWeek || week.activeDays > bestWeek.activeDays) bestWeek = { from: start, to: end, activeDays: week.activeDays };
    }
  }
  return { ...current, focusDeltaMinutes: current.focusMinutes - before.focusMinutes, bestWeek };
}
