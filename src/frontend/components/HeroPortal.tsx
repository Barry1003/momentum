import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface HeroPortalProps {
  kicker: string;
  title: ReactNode;
  children?: ReactNode;
  tags?: ReactNode;
  companionSlot: ReactNode;
  className?: string;
}

export function HeroPortal({ kicker, title, children, tags, companionSlot, className }: HeroPortalProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 overflow-hidden rounded-card bg-cream p-5 shadow-raised",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-heading text-meta font-bold tracking-wide text-accent-strong uppercase">{kicker}</p>
        <p className="mt-1 font-display text-title font-extrabold text-text">{title}</p>
        {children ? <div className="mt-2 font-heading text-body text-text-muted">{children}</div> : null}
        {tags ? <div className="mt-3 flex flex-wrap gap-2">{tags}</div> : null}
      </div>
      <div className="shrink-0">{companionSlot}</div>
    </div>
  );
}
