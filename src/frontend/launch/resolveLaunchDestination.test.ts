import { describe, expect, it } from "vitest";
import { resolveLaunchDestination } from "./resolveLaunchDestination";

describe("launch destination", () => {
  it("does not redirect while state is checking", () => {
    expect(resolveLaunchDestination({ status: "checking" })).toBeNull();
  });

  it("takes first-time visitors to welcome and returning signed-out visitors to sign-in", () => {
    expect(resolveLaunchDestination({ status: "signed-out", hasVisitedBefore: false })).toBe("/onboarding");
    expect(resolveLaunchDestination({ status: "signed-out", hasVisitedBefore: true })).toBe("/onboarding/sign-in");
  });

  it("sends signed-in members with incomplete setup to personalization", () => {
    expect(resolveLaunchDestination({ status: "signed-in", onboardingComplete: false, hasSquad: false })).toBe("/onboarding/name");
  });

  it("distinguishes squad members from solo users after setup", () => {
    expect(resolveLaunchDestination({ status: "signed-in", onboardingComplete: true, hasSquad: true })).toBe("/home?tab=squad");
    expect(resolveLaunchDestination({ status: "signed-in", onboardingComplete: true, hasSquad: false })).toBe("/home");
  });
});
