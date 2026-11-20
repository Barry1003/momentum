import { describe, expect, it } from "vitest";
import { resolveAuthCompletion } from "./complete";

describe("post OAuth handoff", () => {
  it("takes a verified new member to name setup without returning to splash", () => {
    expect(resolveAuthCompletion({ session: "authenticated", emailVerified: true, onboardingStatus: 200, complete: false, destination: "/onboarding/name" }))
      .toEqual({ state: "navigate", destination: "/onboarding/name" });
  });
  it("resumes established onboarding progress", () => {
    expect(resolveAuthCompletion({ session: "authenticated", emailVerified: true, onboardingStatus: 200, complete: false, destination: "/onboarding/companion" }))
      .toEqual({ state: "navigate", destination: "/onboarding/companion" });
  });
  it("routes completed users to their real space", () => {
    expect(resolveAuthCompletion({ session: "authenticated", emailVerified: true, onboardingStatus: 200, complete: true, hasSquad: true }))
      .toEqual({ state: "navigate", destination: "/home?tab=squad" });
  });
  it("does not mistake an unverified session for signed-out", () => {
    expect(resolveAuthCompletion({ session: "authenticated", emailVerified: false })).toEqual({ state: "verify-email" });
  });
  it("never silently starts a new signup when OAuth cookies are missing", () => {
    expect(resolveAuthCompletion({ session: "missing" }).state).toBe("sign-in");
  });
  it("shows a recoverable error for 401, 403 and 500 responses", () => {
    for (const status of [401, 403, 500]) {
      expect(resolveAuthCompletion({ session: "authenticated", emailVerified: true, onboardingStatus: status }).state).toBe("retry");
    }
  });
  it("ignores arbitrary server destinations", () => {
    expect(resolveAuthCompletion({ session: "authenticated", emailVerified: true, onboardingStatus: 200, complete: false, destination: "//evil.example" }))
      .toEqual({ state: "navigate", destination: "/onboarding/name" });
  });
});
