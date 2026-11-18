"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";
import { usePrefersReducedMotion } from "../lib/usePrefersReducedMotion";
import { ActiveCompanionRenderer } from "./activeRenderer";
import type { CompanionLook, CompanionReaction, CompanionSize, GrowthStage } from "./types";

export interface CompanionProps {
  stage: GrowthStage;
  reaction: CompanionReaction;
  look: CompanionLook;
  size: CompanionSize;
  onTap?: () => void;
  onReactionEnd?: () => void;
  reduceMotion?: boolean;
  /** Gently turn toward the pointer/finger, so the companion feels present. */
  followPointer?: boolean;
  className?: string;
}

const MAX_TURN_DEGREES = 9;

export function Companion({
  stage,
  reaction,
  look,
  size,
  onTap,
  onReactionEnd,
  reduceMotion,
  followPointer = false,
  className,
}: CompanionProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const effectiveReduceMotion = reduceMotion ?? prefersReducedMotion;
  const rootRef = useRef<HTMLElement | null>(null);
  const [turn, setTurn] = useState(0);
  const isFollowing = followPointer && !effectiveReduceMotion && size !== "face";

  useEffect(() => {
    if (!isFollowing) return;
    function handlePointerMove(event: PointerEvent) {
      const element = rootRef.current;
      if (!element) return;
      const bounds = element.getBoundingClientRect();
      const offset = (event.clientX - (bounds.left + bounds.width / 2)) / Math.max(window.innerWidth / 2, 1);
      setTurn(Math.max(-1, Math.min(1, offset)));
    }
    function handlePointerLeave() {
      setTurn(0);
    }
    window.addEventListener("pointermove", handlePointerMove);
    document.documentElement.addEventListener("pointerleave", handlePointerLeave);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.documentElement.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [isFollowing]);

  const art = (
    <span
      className="inline-block transition-transform duration-500 ease-out"
      style={isFollowing ? { transform: `perspective(700px) rotateY(${turn * MAX_TURN_DEGREES}deg) rotate(${turn * 1.2}deg)` } : undefined}
    >
      <ActiveCompanionRenderer
        stage={stage}
        reaction={reaction}
        look={look}
        size={size}
        reduceMotion={effectiveReduceMotion}
        onReactionEnd={onReactionEnd}
      />
    </span>
  );

  if (!onTap) {
    return (
      <div ref={(element) => { rootRef.current = element; }} className={className}>
        {art}
      </div>
    );
  }

  return (
    <button
      ref={(element) => { rootRef.current = element; }}
      type="button"
      onClick={onTap}
      aria-label="Say hi to your companion"
      className={cn("cursor-pointer rounded-card", className)}
    >
      {art}
    </button>
  );
}
