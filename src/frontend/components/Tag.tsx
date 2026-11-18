import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export type TagTone = "tint" | "cream" | "success" | "warning" | "white";

const TONE_CLASSES: Record<TagTone, string> = {
  tint: "bg-accent-tint text-accent-strong",
  cream: "bg-cream text-accent-strong",
  success: "bg-success-tint text-success",
  warning: "bg-warning-tint text-warning",
  white: "bg-surface text-text shadow-raised",
};

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: TagTone;
  children: ReactNode;
}

export function Tag({ tone = "tint", children, className, ...rest }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-tag px-2.5 py-1 font-heading text-meta font-medium",
        TONE_CLASSES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
