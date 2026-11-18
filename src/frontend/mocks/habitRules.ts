/**
 * Habit rules that belong to the server (mocked here): what counts as a
 * scheduled day, the current rhythm, and when a consistency moment is earned.
 * The UI only ever displays what these return.
 */

/** Monday-first weekday index (0 = Monday … 6 = Sunday) of an ISO date. */
export function weekdayOf(iso: string): number {
  return (new Date(`${iso}T12:00:00`).getDay() + 6) % 7;
}

export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return isoDate(date);
}

export interface HabitRuleInput {
  scheduleDays: number[];
  targetCount: number;
  startsOn?: string;
  pausedFrom?: string | null;
  pausedUntil?: string | null;
}

/** Whether a habit asks anything of this day. Paused and not-yet-started days never do. */
export function isScheduledOn(habit: HabitRuleInput, iso: string): boolean {
  if (habit.startsOn && iso < habit.startsOn) return false;
  if (habit.pausedFrom && iso >= habit.pausedFrom && (!habit.pausedUntil || iso <= habit.pausedUntil)) return false;
  return habit.scheduleDays.includes(weekdayOf(iso));
}

/**
 * Consecutive scheduled days met, counting back from today. Unscheduled and
 * paused days are skipped, never "missed". Today counts only once it is met.
 */
export function currentRun(habit: HabitRuleInput, history: Record<string, number>, todayIso: string, maxDays = 400): number {
  let run = 0;
  for (let back = 0; back < maxDays; back += 1) {
    const iso = addDays(todayIso, -back);
    if (!isScheduledOn(habit, iso)) continue;
    const met = (history[iso] ?? 0) >= habit.targetCount;
    if (back === 0 && !met) continue;
    if (!met) break;
    run += 1;
  }
  return run;
}

/** XP for a consistency moment, or null if this run length is not a moment. */
export const MOMENT_XP: Record<number, number> = { 7: 15, 14: 30, 30: 60, 60: 100, 100: 150 };
