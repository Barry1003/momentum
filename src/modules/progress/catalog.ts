/** What each achievement measures. Counts come from real activity on the server. */
export type Metric = "tasksCompleted" | "focusDays" | "longFocusSessions" | "bestHabitRun" | "readingDays" | "cheersSent" | "auditReflections";

export interface AchievementDefinition {
  id: string;
  title: string;
  tone: "gold" | "violet" | "mint";
  criteria: string;
  icon: "check" | "play" | "water" | "person" | "read" | "sparkle";
  xp: number;
  metric: Metric;
  total: number;
  headline: string;
  body: string;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: "first-step", title: "First step", tone: "gold", criteria: "Finished your first task", icon: "check", xp: 25, metric: "tasksCompleted", total: 1, headline: "The first one counts most.", body: "Everything since started with this." },
  { id: "finding-rhythm", title: "Finding your rhythm", tone: "violet", criteria: "Focus on 3 different days", icon: "play", xp: 25, metric: "focusDays", total: 3, headline: "A little consistency, your own way.", body: "They don't need to be in a row. There's no streak to protect." },
  { id: "deep-diver", title: "Deep diver", tone: "violet", criteria: "5 focus sessions of 25+ min", icon: "play", xp: 50, metric: "longFocusSessions", total: 5, headline: "You stayed with it.", body: "Five long sessions of real focus." },
  { id: "steady-stream", title: "Steady stream", tone: "mint", criteria: "Keep a habit 7 scheduled days in a row", icon: "water", xp: 30, metric: "bestHabitRun", total: 7, headline: "Little steps, every day.", body: "Seven days of looking after yourself." },
  { id: "bookworm", title: "Bookworm", tone: "mint", criteria: "Read 10 days", icon: "read", xp: 40, metric: "readingDays", total: 10, headline: "Pages add up.", body: "Any ten days of reading, in any order." },
  { id: "good-company", title: "Good company", tone: "violet", criteria: "Cheered a squad member", icon: "person", xp: 15, metric: "cheersSent", total: 1, headline: "Kindness counts too.", body: "Your cheer landed on a friend's stage." },
  { id: "clear-direction", title: "Clear direction", tone: "gold", criteria: "Finish a Life Audit", icon: "sparkle", xp: 60, metric: "auditReflections", total: 12, headline: "A clearer picture.", body: "Twelve short reflections in Growth Studio." },
];

export type Metrics = Record<Metric, number>;

export interface AchievementView {
  id: string;
  title: string;
  tone: AchievementDefinition["tone"];
  earnedOn: string | null;
  criteria: string;
  icon: AchievementDefinition["icon"];
  xp: number;
  isShared: boolean;
  progress: { done: number; total: number } | null;
  counted: { title: string; detail: string; done: boolean }[];
  headline: string;
  body: string;
}

export function formatDay(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Shape one definition for the app, from the person's metrics and what they've earned. */
export function viewOf(definition: AchievementDefinition, metrics: Metrics, earned: { earnedAt: Date; isShared: boolean } | undefined): AchievementView {
  const done = Math.min(definition.total, Math.max(0, metrics[definition.metric]));
  const base = {
    id: definition.id, title: definition.title, tone: definition.tone, criteria: definition.criteria,
    icon: definition.icon, xp: definition.xp, headline: definition.headline, body: definition.body,
  };
  if (earned) {
    const on = formatDay(earned.earnedAt);
    return { ...base, earnedOn: on, isShared: earned.isShared, progress: null, counted: [{ title: definition.criteria, detail: on, done: true }] };
  }
  const left = definition.total - done;
  return {
    ...base,
    earnedOn: null,
    isShared: false,
    progress: { done, total: definition.total },
    counted: [
      { title: `${done} of ${definition.total} so far`, detail: definition.criteria, done: done > 0 },
      { title: `${left} more to go`, detail: "No rush", done: false },
    ],
  };
}

/** Definitions the person has now completed but not yet been given. */
export function newlyEarned(metrics: Metrics, earnedIds: Set<string>): AchievementDefinition[] {
  return ACHIEVEMENTS.filter((item) => !earnedIds.has(item.id) && metrics[item.metric] >= item.total);
}
