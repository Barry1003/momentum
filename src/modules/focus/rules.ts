/** Small grace for network delay between the client's last tick and the server's clock. */
export const CLOCK_GRACE_SECONDS = 5;

/**
 * Seconds the server will credit: never more than the client reports, the time that
 * really passed since the server-stamped start, or the planned length.
 */
export function creditedSeconds(input: { claimed: number; plannedMinutes: number; startedAt: Date; now: Date }): number {
  const elapsed = Math.max(0, Math.floor((input.now.getTime() - input.startedAt.getTime()) / 1000) + CLOCK_GRACE_SECONDS);
  return Math.max(0, Math.min(Math.floor(input.claimed), elapsed, input.plannedMinutes * 60));
}

/** Monday of the week containing `isoDay` (YYYY-MM-DD), as YYYY-MM-DD. */
export function weekStart(isoDay: string): string {
  const date = new Date(`${isoDay}T00:00:00.000Z`);
  const back = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - back);
  return date.toISOString().slice(0, 10);
}
