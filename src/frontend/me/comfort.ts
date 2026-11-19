"use client";

import { useSyncExternalStore } from "react";

/** Device-only display preferences. Nothing here is personal data, so it lives in this browser. */
export interface Comfort {
  textSize: "standard" | "large" | "extraLarge";
  reduceMotion: boolean;
  readableFont: boolean;
  haptics: boolean;
}

export const DEFAULT_COMFORT: Comfort = { textSize: "standard", reduceMotion: false, readableFont: false, haptics: true };
const KEY = "momentum.comfort.v1";
const listeners = new Set<() => void>();
let cached: Comfort | null = null;

function read(): Comfort {
  if (cached) return cached;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Comfort>) : {};
    cached = {
      textSize: parsed.textSize === "large" || parsed.textSize === "extraLarge" ? parsed.textSize : "standard",
      reduceMotion: parsed.reduceMotion === true,
      readableFont: parsed.readableFont === true,
      haptics: parsed.haptics !== false,
    };
  } catch {
    cached = DEFAULT_COMFORT;
  }
  return cached;
}

/** Reflect preferences on <html> so the global styles can apply them everywhere. */
export function applyComfort(comfort: Comfort): void {
  const root = document.documentElement;
  root.dataset.textSize = comfort.textSize;
  root.toggleAttribute("data-reduce-motion", comfort.reduceMotion);
  root.toggleAttribute("data-readable-font", comfort.readableFont);
}

export function saveComfort(comfort: Comfort): void {
  cached = comfort;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(comfort));
  } catch {
    // Storage can be unavailable; the choice still applies for this visit.
  }
  applyComfort(comfort);
  listeners.forEach((notify) => notify());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useComfort(): Comfort {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_COMFORT);
}
