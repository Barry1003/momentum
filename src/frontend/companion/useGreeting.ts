"use client";

import { useCallback, useEffect, useState } from "react";
import type { CompanionReaction } from "./types";

export interface GreetingState {
  reaction: CompanionReaction;
  /** True once the companion has said hello, so a speech bubble can appear. */
  hasGreeted: boolean;
  /** Pass to `<Companion onReactionEnd>` so the one-shot hello returns to idle. */
  onReactionEnd: () => void;
  /** Pass to `<Companion onTap>`: tapping says hello again (never loops). */
  sayHello: () => void;
}

/**
 * The companion waves hello once, shortly after a screen appears, then
 * settles back to idle. Tapping makes it say hello again — once per tap.
 */
export function useGreeting(delayMs = 700): GreetingState {
  const [reaction, setReaction] = useState<CompanionReaction>("idle");
  const [hasGreeted, setHasGreeted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setReaction("hello");
      setHasGreeted(true);
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  const onReactionEnd = useCallback(() => setReaction("idle"), []);
  const sayHello = useCallback(() => {
    setReaction("idle");
    // Restart the one-shot animation on the next frame.
    window.requestAnimationFrame(() => {
      setReaction("hello");
      setHasGreeted(true);
    });
  }, []);

  return { reaction, hasGreeted, onReactionEnd, sayHello };
}
