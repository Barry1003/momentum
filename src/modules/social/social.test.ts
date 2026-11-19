import { describe, expect, it } from "vitest";
import { CHEERS, cheerSchema, momentCheerSchema, muteSchema, reportSchema, sharedGoalPrefsSchema } from "./validation";

describe("squad social validation", () => {
  it("only sends known cheers to a valid id", () => {
    expect(cheerSchema.safeParse({ toUserId: "user_1", message: "High five" }).success).toBe(true);
    expect(cheerSchema.safeParse({ toUserId: "user_1", message: "You owe me" }).success).toBe(false);
    expect(cheerSchema.safeParse({ toUserId: "../x", message: "Wave" }).success).toBe(false);
    expect(CHEERS).toContain("Wave");
  });
  it("only accepts moment ids it makes", () => {
    expect(momentCheerSchema.safeParse({ momentId: "stage:abc123" }).success).toBe(true);
    expect(momentCheerSchema.safeParse({ momentId: "achievement:abc123" }).success).toBe(true);
    expect(momentCheerSchema.safeParse({ momentId: "drop table" }).success).toBe(false);
  });
  it("rejects unknown reasons, long details and extra fields", () => {
    expect(reportSchema.safeParse({ reason: "Spam", details: "Links every hour" }).success).toBe(true);
    expect(reportSchema.safeParse({ reason: "Bad vibes", details: "" }).success).toBe(false);
    expect(reportSchema.safeParse({ reason: "Spam", details: "x".repeat(501) }).success).toBe(false);
    expect(muteSchema.safeParse({ mutedUserId: "u1", muted: true, until: 5 }).success).toBe(false);
    expect(sharedGoalPrefsSchema.safeParse({ linkTask: true, showCount: true, showNames: false }).success).toBe(true);
  });
});
