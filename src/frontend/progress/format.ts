/** Date and duration helpers for the Progress screens. Pure, so they are easy to test. */

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Monday of the week holding `iso`. */
export function weekStart(iso: string): string {
  const weekday = (new Date(`${iso}T12:00:00`).getDay() + 6) % 7;
  return addDays(iso, -weekday);
}

/** "11–17 November", or "11–17 Nov" when short; spans months as "28 Oct–3 Nov". */
export function rangeLabel(from: string, to: string, long = false): string {
  const a = new Date(`${from}T12:00:00`);
  const b = new Date(`${to}T12:00:00`);
  const month = (date: Date) => date.toLocaleDateString("en-GB", { month: long ? "long" : "short" });
  if (from === to) return `${b.getDate()} ${month(b)}`;
  return a.getMonth() === b.getMonth() ? `${a.getDate()}–${b.getDate()} ${month(b)}` : `${a.getDate()} ${month(a)}–${b.getDate()} ${month(b)}`;
}

export function monthRangeLabel(from: string, to: string): string {
  return rangeLabel(from, to);
}

/** "6h 20m", "48m", "0m" */
export function hoursMinutes(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return `${hours}h ${String(rest).padStart(2, "0")}m`;
}

/** "+48m", "−1h 05m", "±0m" */
export function signedMinutes(delta: number): string {
  if (delta === 0) return "±0m";
  return `${delta > 0 ? "+" : "−"}${hoursMinutes(Math.abs(delta))}`;
}
