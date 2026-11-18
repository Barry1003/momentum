import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useToday } from "./useToday";

vi.mock("../api/liveRepository", () => ({
  getToday: vi.fn(async () => ({
    date: "2026-11-18",
    companion: { stage: "child", xp: 0, xpToNextStage: null },
    tasks: [{ id: "task-1", title: "Read today", isDone: false, isShared: false }],
    habits: [], isCheckInPromptVisible: false,
  })),
  completeTask: vi.fn(async () => ({
    task: { id: "task-1", title: "Read today", isDone: true, isShared: false },
    companion: { stage: "child", xp: 0, xpToNextStage: null },
    xpAwarded: 0,
  })),
  undoCompleteTask: vi.fn(),
  addTask: vi.fn(), addHabit: vi.fn(), incrementHabit: vi.fn(),
}));

describe("useToday live API contract", () => {
  it("loads account data and preserves server-reported XP without inventing rewards", async () => {
    const { result } = renderHook(() => useToday());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.tasks[0]?.isDone).toBe(false);
    await act(async () => {
      expect(await result.current.completeTask("task-1")).toBe(0);
    });
    expect(result.current.data?.tasks[0]?.isDone).toBe(true);
    expect(result.current.data?.companion.xp).toBe(0);
  });
});
