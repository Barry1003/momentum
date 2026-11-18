import { describe, expect, it } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useToday } from "./useToday";

describe("useToday", () => {
  it("loads today's data and applies the server-reported companion state after completing a task", async () => {
    const { result } = renderHook(() => useToday());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const task = result.current.data?.tasks.find((item) => !item.isDone);
    const xpBefore = result.current.data?.companion.xp ?? 0;
    expect(task).toBeDefined();

    await act(async () => {
      await result.current.completeTask(task!.id);
    });

    const updatedTask = result.current.data?.tasks.find((item) => item.id === task!.id);
    expect(updatedTask?.isDone).toBe(true);
    // The hook only ever applies the companion value the mock repository
    // returns — it never derives XP itself.
    expect(result.current.data?.companion.xp).toBeGreaterThan(xpBefore);
  });
});
