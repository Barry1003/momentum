import { describe, expect, it } from "vitest";
import { clock, focusReducer, focusedAt, hoursMinutes, initialFocusState, recoverInterrupted, remainingAt, shortDuration, type FocusState } from "./session";

const task = { id: "task-1", title: "Review JS closures", isTodayTask: true };
const MIN = 60_000;

function started(now = 0): FocusState {
  return focusReducer(initialFocusState, { type: "start", now, mode: "solo", task, sessionKey: "k1" });
}

describe("focus session", () => {
  it("counts only time while the timer runs", () => {
    let state = started(0);
    state = focusReducer(state, { type: "pause", now: 10 * MIN });
    expect(focusedAt(state, 30 * MIN)).toBe(10 * MIN);
    state = focusReducer(state, { type: "resume", now: 30 * MIN });
    expect(focusedAt(state, 35 * MIN)).toBe(15 * MIN);
    expect(remainingAt(state, 35 * MIN)).toBe(10 * MIN);
  });

  it("never counts past the planned length", () => {
    const state = started(0);
    expect(focusedAt(state, 90 * MIN)).toBe(25 * MIN);
    expect(remainingAt(state, 90 * MIN)).toBe(0);
  });

  it("stops the clock while asking about finishing early, and keeps going after", () => {
    let state = focusReducer(started(0), { type: "askFinishEarly", now: 14 * MIN });
    expect(state.phase).toBe("finishEarly");
    expect(focusedAt(state, 20 * MIN)).toBe(14 * MIN);
    state = focusReducer(state, { type: "keepGoing", now: 20 * MIN });
    expect(focusedAt(state, 21 * MIN)).toBe(15 * MIN);
  });

  it("banks time on save and shows the server's result", () => {
    let state = focusReducer(started(0), { type: "beginSave", now: 25 * MIN });
    expect(state.phase).toBe("saving");
    expect(state.focusedMs).toBe(25 * MIN);
    state = focusReducer(state, { type: "saved", result: { focusedSeconds: 1500, xpAwarded: 5, weekFocusedMinutes: 190 } });
    expect(state.phase).toBe("complete");
    expect(state.result?.xpAwarded).toBe(5);
  });

  it("starts a fresh round after a break", () => {
    let state = focusReducer(started(0), { type: "beginSave", now: 25 * MIN });
    state = focusReducer(state, { type: "saved", result: { focusedSeconds: 1500, xpAwarded: 5, weekFocusedMinutes: 25 } });
    state = focusReducer(state, { type: "startBreak", now: 26 * MIN });
    expect(state.phase).toBe("break");
    expect(state.breakEndsAt).toBe(31 * MIN);
    state = focusReducer(state, { type: "nextRound", now: 31 * MIN, sessionKey: "k2" });
    expect(state.round).toBe(2);
    expect(state.sessionKey).toBe("k2");
    expect(focusedAt(state, 32 * MIN)).toBe(1 * MIN);
  });

  it("recovers a session that closed mid-run, up to when it was last seen", () => {
    const running = started(0);
    const recovered = recoverInterrupted(running, 14 * MIN);
    expect(recovered?.phase).toBe("interrupted");
    expect(recovered?.focusedMs).toBe(14 * MIN);
    expect(recoverInterrupted(running, 30_000)).toBeNull();
    expect(recoverInterrupted(initialFocusState, 14 * MIN)).toBeNull();
  });

  it("formats times", () => {
    expect(clock(18 * MIN + 42_000)).toBe("18:42");
    expect(shortDuration(6 * MIN + 18_000)).toBe("6m 18s");
    expect(hoursMinutes(190)).toBe("3h 10m");
  });
});
