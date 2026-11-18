import { describe, it, expect } from "vitest";
import { updateProfileSchema } from "./profile";

describe("profile validation", () => {
  it("accepts a valid timezone and anime avatar", () => {
    expect(updateProfileSchema.safeParse({ timezone: "Africa/Lagos", avatarArtStyle: "ANIME" }).success).toBe(true);
  });
  it("rejects unknown fields and invalid timezones", () => {
    expect(updateProfileSchema.safeParse({ userId: "someone-else" }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ timezone: "Invalid/Region" }).success).toBe(false);
  });
  it("rejects empty updates and oversized names", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(false);
    expect(updateProfileSchema.safeParse({ displayName: "x".repeat(81) }).success).toBe(false);
  });
});
