export interface RawNotification {
  id: string;
  at: Date;
  kind: "cheer" | "growth" | "squad" | "review";
  title: string;
  body: string;
  fromName?: string;
}

/** "2m", "3h", "Mon", "12 Nov": short, like the design. */
export function shortWhen(at: Date, now: Date): string {
  const minutes = Math.floor((now.getTime() - at.getTime()) / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return at.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
  return at.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** Newest first, grouped into today and earlier, read when older than the read marker. */
export function shape(items: RawNotification[], readAt: Date | null, now: Date, today: string) {
  return [...items]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 50)
    .map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body,
      when: shortWhen(item.at, now),
      group: item.at.toISOString().slice(0, 10) === today ? ("today" as const) : ("earlier" as const),
      kind: item.kind,
      ...(item.fromName ? { fromName: item.fromName } : {}),
      isRead: readAt !== null && item.at <= readAt,
    }));
}
