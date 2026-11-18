import { describe, expect, it } from "vitest";
import { LOOPING_CLIPS, REACTION_CLIP, STAGE_CLIPS, supportsAlphaWebm } from "./clips";

describe("companion clips", () => {
  it("maps every reaction to a clip or to holding still", () => {
    expect(REACTION_CLIP.idle).toBe("idle");
    expect(REACTION_CLIP.hello).toBe("hello");
    expect(REACTION_CLIP.milestone).toBe("celebrate");
    expect(REACTION_CLIP.focus).toBeNull();
  });

  it("only loops the idle clip", () => {
    expect([...LOOPING_CLIPS]).toEqual(["idle"]);
  });

  it("has body boxes that fit inside the clip frame", () => {
    for (const clips of Object.values(STAGE_CLIPS)) {
      if (!clips) continue;
      const { body } = clips;
      expect(body.left + body.width).toBeLessThanOrEqual(1);
      expect(body.top + body.height).toBeLessThanOrEqual(1);
    }
  });

  it("never claims alpha video support outside the browser", () => {
    expect(supportsAlphaWebm()).toBe(false);
  });
});
