import { describe, expect, it } from "vitest";
import { dueDateFor, milestoneStatuses, targetLabel, taskDetail } from "./rules";
import { goalTaskSchema, milestoneSchema } from "./validation";

describe("milestone statuses", () => {
  it("marks reached, then one current, then later", () => {
    const at = new Date();
    expect(milestoneStatuses([{ reachedAt: at }, { reachedAt: null }, { reachedAt: null }])).toEqual(["reached", "current", "later"]);
    expect(milestoneStatuses([{ reachedAt: at }, { reachedAt: at }])).toEqual(["reached", "reached"]);
    expect(milestoneStatuses([])).toEqual([]);
  });
});

describe("labels", () => {
  it("formats targets and task lines", () => {
    expect(targetLabel(null)).toBe("no target");
    expect(targetLabel(new Date("2026-12-30T00:00:00Z"))).toBe("30 December");
    const today = "2026-11-19";
    expect(taskDetail({ dueDate: new Date("2026-11-19T00:00:00Z"), doneOn: null }, today)).toBe("today");
    expect(taskDetail({ dueDate: null, doneOn: null }, today)).toBe("no date");
    expect(taskDetail({ dueDate: null, doneOn: new Date("2026-11-18T00:00:00Z") }, today)).toBe("Done 18 Nov");
    expect(taskDetail({ dueDate: new Date("2026-11-21T00:00:00Z"), doneOn: null }, today)).toBe("due 21 Nov");
  });
  it("turns 'when' into a due date", () => {
    expect(dueDateFor("today", "2026-11-30")).toBe("2026-11-30");
    expect(dueDateFor("tomorrow", "2026-11-30")).toBe("2026-12-01");
    expect(dueDateFor("noDate", "2026-11-30")).toBeUndefined();
    expect(dueDateFor("pickDate", "2026-11-30", "2026-12-24")).toBe("2026-12-24");
  });
});

describe("goal validation", () => {
  it("needs a date when picking one and rejects extra fields", () => {
    expect(goalTaskSchema.safeParse({ title: "Draft intro", when: "today" }).success).toBe(true);
    expect(goalTaskSchema.safeParse({ title: "Draft intro", when: "pickDate" }).success).toBe(false);
    expect(goalTaskSchema.safeParse({ title: "Draft intro", when: "today", ownerId: "x" }).success).toBe(false);
    expect(milestoneSchema.safeParse({ title: "Plan", criteria: Array(13).fill("x") }).success).toBe(false);
  });
});
