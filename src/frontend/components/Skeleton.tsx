"use client";

import { cn } from "../lib/cn";
import { usePrefersReducedMotion } from "../lib/usePrefersReducedMotion";

export interface SkeletonProps {
  className?: string;
  "aria-label"?: string;
}

export function Skeleton({ className, ...rest }: SkeletonProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div
      role="status"
      aria-busy="true"
      className={cn(
        "rounded-card bg-outline",
        prefersReducedMotion ? "" : "animate-pulse",
        className,
      )}
      {...rest}
    />
  );
}
