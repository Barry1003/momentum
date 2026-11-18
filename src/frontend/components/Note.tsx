import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/cn";

export type NoteTone = "tint" | "cream" | "success" | "warning";

const TONE_STYLES: Record<NoteTone, { background: string; titleColor: string }> = {
  tint: { background: "bg-accent-tint", titleColor: "text-accent-strong" },
  cream: { background: "bg-cream", titleColor: "text-accent-strong" },
  success: { background: "bg-success-tint", titleColor: "text-success" },
  warning: { background: "bg-warning-tint", titleColor: "text-warning" },
};

export interface NoteProps extends HTMLAttributes<HTMLDivElement> {
  tone?: NoteTone;
  title?: string;
  children: ReactNode;
}

export function Note({ tone = "tint", title, children, className, ...rest }: NoteProps) {
  const styles = TONE_STYLES[tone];
  return (
    <div className={cn("rounded-note p-4", styles.background, className)} {...rest}>
      {title ? <p className={cn("mb-1 font-heading text-label font-bold", styles.titleColor)}>{title}</p> : null}
      <div className="font-heading text-body">{children}</div>
    </div>
  );
}
