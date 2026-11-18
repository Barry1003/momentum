/** Calendar helpers for the planner. Pure, so they are easy to test. */

export interface WeekDay {
  /** 0 = Monday … 6 = Sunday */
  index: number;
  iso: string;
  dayLabel: string;
  dateLabel: string;
  isToday: boolean;
}

function isoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Monday-first index of a date's weekday. */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

/** The Monday-to-Sunday week that contains `today`. */
export function weekOf(today: Date): WeekDay[] {
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - weekdayIndex(today));
  const todayIso = isoDate(today);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index);
    return {
      index,
      iso: isoDate(day),
      dayLabel: day.toLocaleDateString("en-GB", { weekday: "short" }),
      dateLabel: String(day.getDate()),
      isToday: isoDate(day) === todayIso,
    };
  });
}

/** "November 2026". */
export function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

/** "16–22 November", or "28 December–3 January" across months. */
export function weekRangeLabel(week: WeekDay[]): string {
  const first = new Date(`${week[0].iso}T12:00:00`);
  const last = new Date(`${week[6].iso}T12:00:00`);
  const lastMonth = last.toLocaleDateString("en-GB", { month: "long" });
  if (first.getMonth() === last.getMonth()) return `${first.getDate()}–${last.getDate()} ${lastMonth}`;
  const firstMonth = first.toLocaleDateString("en-GB", { month: "long" });
  return `${first.getDate()} ${firstMonth}–${last.getDate()} ${lastMonth}`;
}

/** "Wednesday 18" heading for a day's list. */
export function dayHeading(iso: string): string {
  const date = new Date(`${iso}T12:00:00`);
  return `${date.toLocaleDateString("en-GB", { weekday: "long" })} ${date.getDate()}`;
}

export type DaySlot = "morning" | "afternoon" | "evening";

/** Which part of the day a "HH:MM" time falls in. Untimed tasks go to the morning. */
export function slotFor(time: string | undefined): DaySlot {
  if (!time) return "morning";
  const hour = Number(time.slice(0, 2));
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export const SLOT_LABELS: Record<DaySlot, { label: string; hours: string }> = {
  morning: { label: "Morning", hours: "8–12" },
  afternoon: { label: "Afternoon", hours: "12–17" },
  evening: { label: "Evening", hours: "17–22" },
};
