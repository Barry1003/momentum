import { describe, expect, it } from "vitest";
import { createGoalSchema, createTaskSchema, completeTaskSchema, asUtcDate } from "./validation";
import { canReadTask, canCompleteTask, canEditGoal, validTaskScope } from "./policy";

describe("planning access decisions", () => {
  it("isolates private tasks regardless of squad role", () => {
    expect(canReadTask("alice", "bob", "PRIVATE", true)).toBe(false);
    expect(canReadTask("alice", "bob", "SQUAD", true)).toBe(true);
    expect(canReadTask("alice", "bob", "SQUAD", false)).toBe(false);
    expect(validTaskScope("SQUAD", null)).toBe(false);
  });
  it("limits shared-goal writes to editor or owner", () => {
    expect(canEditGoal("alice", "bob", "VIEWER")).toBe(false);
    expect(canEditGoal("alice", "bob", "EDITOR")).toBe(true);
    expect(canEditGoal("alice", "alice", null)).toBe(true);
  });
  it("limits completion to assignee or owner", () => {
    expect(canCompleteTask("alice", "bob", "alice")).toBe(false);
    expect(canCompleteTask("alice", "bob", "bob")).toBe(true);
    expect(canCompleteTask("alice", null, "alice")).toBe(true);
  });
});
describe("planning validation", () => {
  it("rejects forged owner identity and invalid date", () => {
    expect(createGoalSchema.safeParse({ title: "Learn", ownerId: "forged" }).success).toBe(false);
    expect(createGoalSchema.safeParse({ title: "Learn", targetDate: "2026-02-31" }).success).toBe(false);
    expect(createGoalSchema.safeParse({ title: "Learn", targetDate: "2026-12-01" }).success).toBe(true);
  });
  it("rejects extra task fields and invalid times", () => {
    expect(createTaskSchema.safeParse({ title: "Study", userId: "someone" }).success).toBe(false);
    expect(createTaskSchema.safeParse({ title: "Study", dueTime: "25:99" }).success).toBe(false);
    expect(completeTaskSchema.safeParse({ occurrenceDate: "2026-11-18" }).success).toBe(true);
    expect(asUtcDate("2026-11-18").toISOString().startsWith("2026-11-18")).toBe(true);
  });
});
