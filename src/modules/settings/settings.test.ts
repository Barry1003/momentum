import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ getPrisma: () => { throw new Error("not used"); } }));
import { suggestedHandle } from "./service";
import { handleSchema, privacySchema, profileDetailsSchema, quietHoursSchema, remindersSchema } from "./validation";

describe("settings validation", () => {
  it("normalises handles and rejects bad ones", () => {
    expect(handleSchema.parse("@Ari_Dev")).toBe("ari_dev");
    expect(handleSchema.safeParse("ab").success).toBe(false);
    expect(handleSchema.safeParse("has space").success).toBe(false);
    expect(profileDetailsSchema.safeParse({ handle: "ari", intention: "x".repeat(141) }).success).toBe(false);
  });
  it("checks quiet hours", () => {
    const base = { enabled: true, from: "22:00", to: "08:00", days: "everyDay", customDays: [] };
    expect(quietHoursSchema.safeParse(base).success).toBe(true);
    expect(quietHoursSchema.safeParse({ ...base, to: "22:00" }).success).toBe(false);
    expect(quietHoursSchema.safeParse({ ...base, days: "custom" }).success).toBe(false);
    expect(quietHoursSchema.safeParse({ ...base, from: "25:00" }).success).toBe(false);
  });
  it("rejects extra fields", () => {
    expect(privacySchema.safeParse({ shareCheckedIn: true, shareFocusStatus: true, shareFinishedSharedTasks: true, shareGrowthStage: true, shareStreaksAndXp: false, userId: "x" }).success).toBe(false);
    expect(remindersSchema.safeParse({ morningPlan: true, morningPlanTime: "8:30", eveningCheckIn: true, eveningCheckInTime: "21:00", habitReminders: true, squadCheers: false, reviewDay: true }).success).toBe(false);
  });
  it("suggests a handle from the display name", () => {
    expect(suggestedHandle("Ari Bello")).toBe("aribello");
    expect(suggestedHandle("Jo")).toBe("joy");
    expect(suggestedHandle("")).toBe("you");
  });
});
