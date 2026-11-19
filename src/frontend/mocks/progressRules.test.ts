import { describe, expect, it } from "vitest";
import { nextStageState, stageForXp } from "./progressRules";

describe("growth stages", () => {
  it("maps XP to stages", () => {
    expect(stageForXp(0)).toBe("child");
    expect(stageForXp(1260)).toBe("teen");
    expect(stageForXp(1600)).toBe("youngAdult");
  });

  it("only moves forward", () => {
    expect(nextStageState("teen", 1610)).toEqual({ stage: "youngAdult", xpToNextStage: 3000 });
    expect(nextStageState("youngAdult", 1590)).toEqual({ stage: "youngAdult", xpToNextStage: 3000 });
    expect(nextStageState("adult", 5000).xpToNextStage).toBeNull();
  });
});
