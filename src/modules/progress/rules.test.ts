import { describe, expect, it } from "vitest";
import { ACHIEVEMENTS, newlyEarned, viewOf, type Metrics } from "./catalog";
import { clampRange, progressSummary, type ProgressInput } from "./rules";
import { checkInSchema } from "./validation";

const empty: Metrics = { tasksCompleted: 0, focusDays: 0, longFocusSessions: 0, bestHabitRun: 0, readingDays: 0, cheersSent: 0, auditReflections: 0 };

describe("range", () => {
  it("orders, clamps to today and caps at a year", () => {
    expect(clampRange("2026-11-20", "2026-11-10", "2026-11-19")).toEqual({ from: "2026-11-10", to: "2026-11-19" });
    expect(clampRange("2026-12-01", "2026-12-05", "2026-11-19")).toEqual({ from: "2026-11-19", to: "2026-11-19" });
    expect(clampRange("2020-01-01", "2026-11-19", "2026-11-19").from).toBe("2025-11-19");
    expect(clampRange("bad", null, "2026-11-19")).toEqual({ from: "2026-11-19", to: "2026-11-19" });
  });
});

describe("progress summary", () => {
  const input: ProgressInput = {
    focusByDay: { "2026-11-18": 30, "2026-11-19": 20, "2026-11-11": 10 },
    tasksByDay: { "2026-11-19": 2 },
    habits: [{ id: "h1", name: "Read", icon: "read", scheduleDays: [0, 1, 2, 3, 4, 5, 6], targetCount: 1, history: { "2026-11-18": 1 } }],
    goals: [{ id: "g1", title: "Ship", isPaused: false }],
    goalTasksByDay: { g1: { "2026-11-19": 1 } },
    goalFocusByDay: { g1: { "2026-11-18": 30 } },
  };
  it("adds up the range and compares with the week before", () => {
    const result = progressSummary(input, "2026-11-13", "2026-11-19");
    expect(result.focusMinutes).toBe(50);
    expect(result.tasksDone).toBe(2);
    expect(result.activeDays).toBe(2);
    expect(result.habitsKeptPercent).toBe(14);
    expect(result.focusDeltaMinutes).toBe(40);
    expect(result.byGoal[0]?.tasksDone).toBe(1);
    expect(result.byGoal[0]?.focusMinutes).toBe(30);
    expect(result.bestWeek).toBeNull();
  });
});

describe("achievements", () => {
  it("earns only what the metrics reach, once", () => {
    const metrics = { ...empty, tasksCompleted: 1, focusDays: 2 };
    expect(newlyEarned(metrics, new Set()).map((item) => item.id)).toEqual(["first-step"]);
    expect(newlyEarned(metrics, new Set(["first-step"])).length).toBe(0);
  });
  it("shows progress for ones not earned yet", () => {
    const rhythm = ACHIEVEMENTS.find((item) => item.id === "finding-rhythm");
    expect(rhythm).toBeDefined();
    if (!rhythm) return;
    const view = viewOf(rhythm, { ...empty, focusDays: 2 }, undefined);
    expect(view.progress?.done).toBe(2);
    expect(view.earnedOn).toBeNull();
    const earned = viewOf(rhythm, { ...empty, focusDays: 9 }, { earnedAt: new Date("2026-11-19T00:00:00Z"), isShared: true });
    expect(earned.earnedOn).toBe("19 Nov 2026");
    expect(earned.progress).toBeNull();
  });
});

describe("check-in validation", () => {
  it("accepts the app's values and rejects extra fields", () => {
    expect(checkInSchema.safeParse({ mood: "good", effort: "steady", win: "Shipped", obstacle: "", shareCheckedIn: true }).success).toBe(true);
    expect(checkInSchema.safeParse({ mood: "good", effort: "steady", win: "", obstacle: "", shareCheckedIn: true, xp: 99 }).success).toBe(false);
    expect(checkInSchema.safeParse({ mood: "ecstatic", effort: "steady", win: "", obstacle: "", shareCheckedIn: true }).success).toBe(false);
  });
});
