"use client";

import { useSyncExternalStore } from "react";
import { dateKicker, greetingFor } from "./growth";

function subscribeMinute(callback: () => void) {
  const timer = window.setInterval(callback, 60_000);
  return () => window.clearInterval(timer);
}

/** Greeting and date, computed in the browser (local time) and refreshed each minute. */
export function useGreetingLine(): { greeting: string; kicker: string } {
  const greeting = useSyncExternalStore(subscribeMinute, () => greetingFor(new Date()), () => "Hello");
  const kicker = useSyncExternalStore(subscribeMinute, () => dateKicker(new Date()), () => "TODAY");
  return { greeting, kicker };
}

function subscribeNever() {
  return () => {};
}

function readDisplayName(): string {
  try {
    const stored = window.sessionStorage.getItem("momentum.onboarding");
    const parsed: unknown = stored ? JSON.parse(stored) : null;
    const name = (parsed as { displayName?: unknown } | null)?.displayName;
    if (typeof name === "string" && name.trim()) return name.trim();
  } catch {
    // Storage can be unavailable; fall back to the preview name.
  }
  return "Ari";
}

/**
 * Display name from onboarding (preview only — the real value will come from
 * the profile API). Falls back to "Ari", the design's example user.
 */
export function useDisplayName(): string {
  return useSyncExternalStore(subscribeNever, readDisplayName, () => "Ari");
}
