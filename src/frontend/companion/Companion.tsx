"use client";

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
  className?: string;
}

export function Companion({
  stage,
  reaction,
  look,
  size,
  onTap,
  onReactionEnd,
  reduceMotion,
  className,
}: CompanionProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const effectiveReduceMotion = reduceMotion ?? prefersReducedMotion;

  const art = (
    <ActiveCompanionRenderer
      stage={stage}
      reaction={reaction}
      look={look}
      size={size}
      reduceMotion={effectiveReduceMotion}
      onReactionEnd={onReactionEnd}
    />
  );

  if (!onTap) {
    return <div className={className}>{art}</div>;
  }

  return (
    <button type="button" onClick={onTap} aria-label="Ari, your companion" className={cn("cursor-pointer", className)}>
      {art}
    </button>
  );
}
