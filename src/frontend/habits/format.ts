import type { Habit } from "../mocks/types";

export const DAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const DAY_LETTER = ["M", "T", "W", "T", "F", "S", "S"];
export const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
export const WEEKDAYS = [0, 1, 2, 3, 4];

export function sameDays(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((day) => b.includes(day));
}

/** "Every day", "Weekdays", or "Mon Wed Fri Sun". */
export function scheduleLabel(days: number[] | undefined): string {
  const list = days ?? EVERY_DAY;
  if (sameDays(list, EVERY_DAY)) return "Every day";
  if (sameDays(list, WEEKDAYS)) return "Weekdays";
  return [...list].sort((a, b) => a - b).map((day) => DAY_SHORT[day]).join(" ");
}

/** Line under a habit on Today. */
export function todayLine(habit: Habit): string {
  const done = habit.completedCount >= habit.targetCount;
  if (habit.kind === "target") {
    return `${habit.completedCount} of ${habit.targetCount} ${habit.unit ?? "times"}`;
  }
  if (habit.kind === "timer") {
    const length = habit.detail ?? `${habit.targetCount} min`;
    return done ? `${length} · done` : length;
  }
  if (done) return habit.detail ? `${habit.detail} · done` : "Done";
  return habit.detail ?? "Tap to check";
}

/** "Sleep by 23:00" → "Sleep"; first word for the week grid's row labels. */
export function shortName(habit: Habit): string {
  if (habit.icon === "water") return "Water";
  if (habit.icon === "sparkle" && /lights out|sleep/i.test(habit.name)) return "Sleep";
  return habit.name.split(" ")[0];
}

/** A short "unit" phrase for the month header: "days you read". */
export function verbFor(habit: Habit): string {
  if (habit.icon === "water") return "days you drank enough water";
  if (habit.icon === "read") return "days you read";
  if (habit.icon === "move") return "days you moved";
  return `days you kept “${habit.name}”`;
}

export function longDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  return `${date.getDate()} ${date.toLocaleDateString("en-GB", { month: "long" })}`;
}

export function weekdayDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  return `${date.toLocaleDateString("en-GB", { weekday: "long" })} ${date.getDate()}`;
}

/** Monday-first weekday index of an ISO date. */
export function weekdayOf(iso: string): number {
  return (new Date(`${iso}T12:00:00`).getDay() + 6) % 7;
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** The seven ISO dates of the Monday-first week `offset` weeks from the one holding `todayIso`. */
export function weekDates(todayIso: string, offset: number): string[] {
  const monday = addDays(todayIso, -weekdayOf(todayIso) + offset * 7);
  return Array.from({ length: 7 }, (_, index) => addDays(monday, index));
}

/** "9–15 Nov", or "30 Nov–6 Dec". */
export function shortRange(dates: string[]): string {
  const first = new Date(`${dates[0]}T12:00:00`);
  const last = new Date(`${dates[dates.length - 1]}T12:00:00`);
  const month = (date: Date) => date.toLocaleDateString("en-GB", { month: "short" });
  return first.getMonth() === last.getMonth()
    ? `${first.getDate()}–${last.getDate()} ${month(last)}`
    : `${first.getDate()} ${month(first)}–${last.getDate()} ${month(last)}`;
}

/** Calendar cells for a month, Monday first, with nulls for the blanks before day 1. */
export function monthCells(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1, 12);
  const days = new Date(year, month + 1, 0, 12).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let day = 1; day <= days; day += 1) {
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  return cells;
}

/** Same scheduling rule the server uses, for drawing the calendar only. */
export function scheduledOn(habit: Habit, iso: string): boolean {
  if (habit.startsOn && iso < habit.startsOn) return false;
  if (habit.pausedFrom && iso >= habit.pausedFrom && (!habit.pausedUntil || iso <= habit.pausedUntil)) return false;
  return (habit.scheduleDays ?? EVERY_DAY).includes(weekdayOf(iso));
}

export function isPausedNow(habit: Habit, todayIso: string): boolean {
  return Boolean(habit.pausedFrom && habit.pausedFrom <= addDays(todayIso, 1) && (!habit.pausedUntil || habit.pausedUntil >= todayIso));
}
