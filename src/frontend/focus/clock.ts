"use client";

import { useSyncExternalStore } from "react";

let now = 0;
let timer: number | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (timer === null) {
    now = Date.now();
    timer = window.setInterval(() => {
      now = Date.now();
      listeners.forEach((notify) => notify());
    }, 500);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };
}

/** A shared clock that ticks twice a second while anything is watching it. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, () => now, () => 0);
}
