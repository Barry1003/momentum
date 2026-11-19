/** All XP policy amounts live here; review before launch. */
export const XP = {
  task: 10,
  habitUnit: 5,
  checkIn: 10,
  milestone: 60,
  goal: 200,
  focusSecondsPerUnit: 300,
  focusMinSeconds: 60,
  focusXpPerUnit: 1,
  habitMoments: { 7: 15, 14: 30, 30: 60, 60: 100, 100: 150 } as Record<number, number>,
} as const;

export const STAGES = [
  { stage: "CHILD", from: 0 },
  { stage: "PRETEEN", from: 400 },
  { stage: "TEEN", from: 900 },
  { stage: "YOUNG_ADULT", from: 1600 },
  { stage: "ADULT", from: 3000 },
] as const;

export type Stage = (typeof STAGES)[number]["stage"];
export function permanentStage(current: Stage, totalXp: number): Stage {
  const earned = STAGES.filter((item) => totalXp >= item.from).at(-1)!.stage;
  const currentIndex = STAGES.findIndex((item) => item.stage === current);
  const earnedIndex = STAGES.findIndex((item) => item.stage === earned);
  return STAGES[Math.max(currentIndex, earnedIndex)].stage;
}
export function nextThreshold(stage: Stage): number | null {
  const index = STAGES.findIndex((item) => item.stage === stage);
  return STAGES[index + 1]?.from ?? null;
}
export function focusQuote(focusedSeconds: number): number {
  if (!Number.isSafeInteger(focusedSeconds) || focusedSeconds < XP.focusMinSeconds) return 0;
  return Math.ceil(focusedSeconds / XP.focusSecondsPerUnit) * XP.focusXpPerUnit;
}
