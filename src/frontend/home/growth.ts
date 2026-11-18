import type { GrowthStage } from "../companion/types";

export const GROWTH_STAGES: { stage: GrowthStage; label: string }[] = [
  { stage: "child", label: "Child" },
  { stage: "preteen", label: "Preteen" },
  { stage: "teen", label: "Teen" },
  { stage: "youngAdult", label: "Young Adult" },
  { stage: "adult", label: "Adult" },
];

export function stageIndex(stage: GrowthStage): number {
  return GROWTH_STAGES.findIndex((item) => item.stage === stage);
}

export function stageLabel(stage: GrowthStage): string {
  return GROWTH_STAGES[stageIndex(stage)]?.label ?? "";
}

export function nextStageLabel(stage: GrowthStage): string | null {
  return GROWTH_STAGES[stageIndex(stage) + 1]?.label ?? null;
}

/**
 * Where to draw the growth bar, from server-provided XP values only.
 * Returns 0–1 across the five stage dots (each gap is one stage).
 */
export function growthBarPosition(stage: GrowthStage, xp: number, xpToNextStage: number | null): number {
  const index = stageIndex(stage);
  const gaps = GROWTH_STAGES.length - 1;
  if (xpToNextStage === null || index >= gaps) return 1;
  const withinStage = xpToNextStage > 0 ? Math.min(1, Math.max(0, xp / xpToNextStage)) : 0;
  // Stage dots are evenly spaced; partial progress fills toward the next dot.
  return (index + withinStage) / gaps;
}

export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function dateKicker(date: Date): string {
  return date
    .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    .replace(",", "")
    .replace(/^(\w+) /, "$1 · ")
    .toUpperCase();
}
