import type { GrowthStage } from "../companion/types";

/** XP at which each permanent growth stage begins (server rule, mocked). */
export const STAGE_THRESHOLDS: { stage: GrowthStage; from: number }[] = [
  { stage: "child", from: 0 },
  { stage: "preteen", from: 400 },
  { stage: "teen", from: 900 },
  { stage: "youngAdult", from: 1600 },
  { stage: "adult", from: 3000 },
];

const ORDER: GrowthStage[] = STAGE_THRESHOLDS.map((item) => item.stage);

export function stageForXp(xp: number): GrowthStage {
  let stage: GrowthStage = "child";
  for (const item of STAGE_THRESHOLDS) if (xp >= item.from) stage = item.stage;
  return stage;
}

/** Growth is never taken away: the stage only moves forward, even if XP is undone. */
export function nextStageState(currentStage: GrowthStage, xp: number): { stage: GrowthStage; xpToNextStage: number | null } {
  const earned = stageForXp(xp);
  const stage = ORDER.indexOf(earned) > ORDER.indexOf(currentStage) ? earned : currentStage;
  const next = STAGE_THRESHOLDS[ORDER.indexOf(stage) + 1];
  return { stage, xpToNextStage: next ? next.from : null };
}

/** A small extra unlocked with each stage. */
export const STAGE_EXTRAS: Record<GrowthStage, string> = {
  child: "First room",
  preteen: "Sunrise room",
  teen: "Sage room",
  youngAdult: "Gold aura extra",
  adult: "Midnight room",
};
