import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface AriBubbleProps {
  name: string;
  avatar: ReactNode;
  children: ReactNode;
  className?: string;
}

export function AriBubble({ name, avatar, children, className }: AriBubbleProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span className="h-11 w-11 shrink-0 overflow-hidden rounded-full shadow-raised">{avatar}</span>
      <div className="rounded-tr-note rounded-br-note rounded-bl-note rounded-tl-md bg-accent-tint px-4 py-3">
        <p className="mb-0.5 font-heading text-meta font-bold text-accent-strong">{name}</p>
        <p className="font-heading text-body text-text">{children}</p>
      </div>
    </div>
  );
}
