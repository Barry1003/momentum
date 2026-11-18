import { describe, expect, it } from "vitest";
import { onboardingPatchSchema, nextOnboardingDestination } from "./contract";

describe("onboarding contract", () => {
  it("rejects stage/XP and forged ownership changes", () => {
    expect(onboardingPatchSchema.safeParse({ step: "companion", companionName: "Ari", companionStyle: "anime", companionLook: "boy", stage: "ADULT" }).success).toBe(false);
    expect(onboardingPatchSchema.safeParse({ step: "name", displayName: "Ari", userId: "other" }).success).toBe(false);
  });
  it("does not skip required steps", () => {
    expect(nextOnboardingDestination({ complete: false, profile: null, avatar: null, path: "solo", hasSquad: false })).toBe("/onboarding/name");
    expect(nextOnboardingDestination({ complete: false, profile: { onboardingStep: "NAME" }, avatar: null, path: "solo", hasSquad: false })).toBe("/onboarding/companion");
    expect(nextOnboardingDestination({ complete: false, profile: { onboardingStep: "PATH" }, avatar: { name: "Ari" }, path: "squad", hasSquad: false })).toBe("/onboarding/join");
    expect(nextOnboardingDestination({ complete: true, profile: { onboardingStep: "COMPLETE" }, avatar: { name: "Ari" }, path: "solo", hasSquad: false })).toBe("/home");
  });
});
