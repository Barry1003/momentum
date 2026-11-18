"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
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

/** Read identity from the verified session's profile, not sessionStorage. */
export function useDisplayName(): string {
  const [displayName, setDisplayName] = useState("Friend");
  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/onboarding", {
      credentials: "same-origin", cache: "no-store", signal: controller.signal,
    }).then(async response => {
      if (!response.ok) return;
      const data = await response.json() as { profile?: { displayName?: string } | null };
      const name = data.profile?.displayName?.trim();
      if (name && !controller.signal.aborted) setDisplayName(name);
    }).catch(() => { /* Keep neutral fallback; never trust a local draft. */ });
    return () => controller.abort();
  }, []);
  return displayName;
}
