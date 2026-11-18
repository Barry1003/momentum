import { initialFocusState, recoverInterrupted, type FocusState } from "./session";

const KEY = "momentum.focus.v1";

interface Stored {
  state: FocusState;
  lastSeenAt: number;
}

/** Remember the session on this device, so a closed tab can pick it up again. */
export function persistFocus(state: FocusState, lastSeenAt: number): void {
  try {
    const keep = ["active", "paused", "finishEarly", "interrupted", "offline", "saveError"].includes(state.phase);
    if (keep) window.localStorage.setItem(KEY, JSON.stringify({ state, lastSeenAt } satisfies Stored));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Storage can be unavailable (private mode); the session still runs.
  }
}

export function clearFocus(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}

/** What to show when the Focus page opens: a recovered or unsaved session, or a fresh setup. */
export function loadFocus(): FocusState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return initialFocusState;
    const stored = JSON.parse(raw) as Stored;
    if (!stored?.state || typeof stored.lastSeenAt !== "number") return initialFocusState;
    const state = { ...initialFocusState, ...stored.state };
    if (state.phase === "offline" || state.phase === "saveError" || state.phase === "interrupted") return state;
    return recoverInterrupted(state, stored.lastSeenAt) ?? initialFocusState;
  } catch {
    return initialFocusState;
  }
}
