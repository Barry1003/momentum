import { describe, expect, it } from "vitest";
import { companionNameSchema, displayNameSchema, emailSchema } from "./schemas";

describe("onboarding schemas", () => {
  it("accepts a valid email and rejects a malformed one", () => {
    expect(emailSchema.safeParse("ari@example.com").success).toBe(true);
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
    expect(emailSchema.safeParse("").success).toBe(false);
  });

  it("enforces display name length between 2 and 24 characters", () => {
    expect(displayNameSchema.safeParse("Ari").success).toBe(true);
    expect(displayNameSchema.safeParse("A").success).toBe(false);
    expect(displayNameSchema.safeParse("A".repeat(25)).success).toBe(false);
    expect(displayNameSchema.safeParse("A".repeat(24)).success).toBe(true);
  });

  it("enforces companion name between 1 and 20 characters", () => {
    expect(companionNameSchema.safeParse("Ari").success).toBe(true);
    expect(companionNameSchema.safeParse("").success).toBe(false);
    expect(companionNameSchema.safeParse("A".repeat(21)).success).toBe(false);
  });
});
