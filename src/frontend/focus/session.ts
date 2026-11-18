/**
 * Focus session state machine (Figma 04 · Do the work, 04b · Focus states).
 *
 * Pure: every action that depends on time carries `now`, so the reducer is
 * easy to test and never reads the clock itself. Focused time counts only
 * while the timer runs: pauses, breaks and the finish-early question do not.
 * XP is never worked out here; it comes back from the server with `saved`.
 */

export type FocusPhase =
  | "setup"
  | "choose"
  | "lobby"
  | "active"
  | "paused"
  | "finishEarly"
  | "saving"
  | "complete"
  | "break"
  | "interrupted"
  | "offline"
  | "saveError";

export type FocusMode = "solo" | "squad";
export type StopReason = "taskDone" | "interrupted" | "needBreak" | "other";

export interface FocusTaskRef {
  id: string;
  title: string;
  detail?: string;
  /** Only tasks on today's list can be marked done from the end screen. */
  isTodayTask: boolean;
}

/** What the person picked on setup: the default task, a chosen one, or none. */
export type TaskChoice = { kind: "auto" } | { kind: "task"; task: FocusTaskRef } | { kind: "none" };

export interface FocusResult {
  focusedSeconds: number;
  xpAwarded: number;
  weekFocusedMinutes: number;
}

export interface FocusState {
  phase: FocusPhase;
  taskChoice: TaskChoice;
  /** The task frozen when the session started. */
  task: FocusTaskRef | null;
  lengthMinutes: number;
  breakMinutes: number;
  shareFocusing: boolean;
  mode: FocusMode;
  round: number;
  focusedMs: number;
  runningSince: number | null;
  pausedAt: number | null;
  breakEndsAt: number | null;
  lobbyOpenedAt: number | null;
  stopReason: StopReason | null;
  result: FocusResult | null;
  /** When the app was last seen running before it closed (interrupted sessions). */
  closedAt: number | null;
  /** Identifies this round to the server so a retried save never counts twice. */
  sessionKey: string | null;
}

export const LENGTH_OPTIONS = [15, 25, 45, 60] as const;
export const BREAK_OPTIONS = [5, 10, 0] as const;
export const PAUSE_AUTO_END_MS = 15 * 60_000;

export const initialFocusState: FocusState = {
  phase: "setup",
  taskChoice: { kind: "auto" },
  task: null,
  lengthMinutes: 25,
  breakMinutes: 5,
  shareFocusing: true,
  mode: "solo",
  round: 1,
  focusedMs: 0,
  runningSince: null,
  pausedAt: null,
  breakEndsAt: null,
  lobbyOpenedAt: null,
  stopReason: null,
  result: null,
  closedAt: null,
  sessionKey: null,
};

export type FocusAction =
  | { type: "chooseTask"; choice: TaskChoice }
  | { type: "openChoose" }
  | { type: "closeChoose" }
  | { type: "setLength"; minutes: number }
  | { type: "cycleBreak" }
  | { type: "toggleShare" }
  | { type: "openLobby"; now: number }
  | { type: "leaveLobby" }
  | { type: "start"; now: number; mode: FocusMode; task: FocusTaskRef | null; sessionKey: string }
  | { type: "pause"; now: number }
  | { type: "resume"; now: number }
  | { type: "askFinishEarly"; now: number }
  | { type: "keepGoing"; now: number }
  | { type: "setReason"; reason: StopReason | null }
  | { type: "beginSave"; now: number }
  | { type: "saved"; result: FocusResult }
  | { type: "saveFailed"; offline: boolean }
  | { type: "startBreak"; now: number }
  | { type: "nextRound"; now: number; sessionKey: string }
  | { type: "continueInterrupted"; now: number }
  | { type: "restore"; state: FocusState }
  | { type: "reset" };

/** Milliseconds focused so far, counting the running stretch up to `now`. */
export function focusedAt(state: FocusState, now: number): number {
  const running = state.runningSince === null ? 0 : Math.max(0, now - state.runningSince);
  return Math.min(state.lengthMinutes * 60_000, state.focusedMs + running);
}

export function remainingAt(state: FocusState, now: number): number {
  return Math.max(0, state.lengthMinutes * 60_000 - focusedAt(state, now));
}

/** Stop the running stretch, banking its time. */
function bank(state: FocusState, now: number): FocusState {
  return { ...state, focusedMs: focusedAt(state, now), runningSince: null };
}

export function focusReducer(state: FocusState, action: FocusAction): FocusState {
  switch (action.type) {
    case "chooseTask":
      return { ...state, taskChoice: action.choice, phase: state.phase === "choose" ? "setup" : state.phase };
    case "openChoose":
      return state.phase === "setup" ? { ...state, phase: "choose" } : state;
    case "closeChoose":
      return state.phase === "choose" ? { ...state, phase: "setup" } : state;
    case "setLength":
      return state.phase === "setup" ? { ...state, lengthMinutes: action.minutes } : state;
    case "cycleBreak": {
      const index = BREAK_OPTIONS.indexOf(state.breakMinutes as (typeof BREAK_OPTIONS)[number]);
      return { ...state, breakMinutes: BREAK_OPTIONS[(index + 1) % BREAK_OPTIONS.length] };
    }
    case "toggleShare":
      return { ...state, shareFocusing: !state.shareFocusing };
    case "openLobby":
      return state.phase === "setup" ? { ...state, phase: "lobby", lobbyOpenedAt: action.now } : state;
    case "leaveLobby":
      return state.phase === "lobby" ? { ...state, phase: "setup", lobbyOpenedAt: null } : state;
    case "start":
      if (state.phase !== "setup" && state.phase !== "lobby") return state;
      return {
        ...state,
        phase: "active",
        mode: action.mode,
        task: action.task,
        sessionKey: action.sessionKey,
        focusedMs: 0,
        runningSince: action.now,
        pausedAt: null,
        stopReason: null,
        result: null,
      };
    case "pause":
      return state.phase === "active" ? { ...bank(state, action.now), phase: "paused", pausedAt: action.now } : state;
    case "resume":
      return state.phase === "paused" ? { ...state, phase: "active", runningSince: action.now, pausedAt: null } : state;
    case "askFinishEarly":
      if (state.phase !== "active" && state.phase !== "paused") return state;
      return { ...bank(state, action.now), phase: "finishEarly", pausedAt: state.pausedAt ?? action.now };
    case "keepGoing":
      return state.phase === "finishEarly"
        ? { ...state, phase: "active", runningSince: action.now, pausedAt: null, stopReason: null }
        : state;
    case "setReason":
      return { ...state, stopReason: action.reason };
    case "beginSave":
      if (!["active", "paused", "finishEarly", "interrupted", "offline", "saveError"].includes(state.phase)) return state;
      return { ...bank(state, action.now), phase: "saving", pausedAt: null };
    case "saved":
      return { ...state, phase: "complete", result: action.result, closedAt: null };
    case "saveFailed":
      return { ...state, phase: action.offline ? "offline" : "saveError" };
    case "startBreak":
      if (state.phase !== "complete" && state.phase !== "active") return state;
      return {
        ...bank(state, action.now),
        phase: "break",
        breakEndsAt: action.now + Math.max(1, state.breakMinutes || 5) * 60_000,
      };
    case "nextRound":
      return state.phase === "break"
        ? {
            ...state,
            phase: "active",
            round: state.round + 1,
            sessionKey: action.sessionKey,
            focusedMs: 0,
            runningSince: action.now,
            breakEndsAt: null,
            stopReason: null,
            result: null,
          }
        : state;
    case "continueInterrupted":
      return state.phase === "interrupted"
        ? { ...state, phase: "active", runningSince: action.now, pausedAt: null, closedAt: null }
        : state;
    case "restore":
      return action.state;
    case "reset":
      return { ...initialFocusState, lengthMinutes: state.lengthMinutes, breakMinutes: state.breakMinutes, shareFocusing: state.shareFocusing };
    default:
      return state;
  }
}

/**
 * A session found in storage from a run that closed while the timer was going.
 * Time up to the last moment the app was seen counts; nothing after it does.
 */
export function recoverInterrupted(saved: FocusState, lastSeenAt: number): FocusState | null {
  const wasRunning = saved.phase === "active" || saved.phase === "paused" || saved.phase === "finishEarly";
  if (!wasRunning) return null;
  const banked = saved.runningSince === null ? saved : bank(saved, lastSeenAt);
  if (banked.focusedMs < 60_000) return null;
  return { ...banked, phase: "interrupted", pausedAt: null, closedAt: lastSeenAt };
}

/** "18:42" */
export function clock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/** "6m 18s" */
export function shortDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return minutes ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

/** "3h 10m" */
export function hoursMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}
