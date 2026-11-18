import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export interface GreetingBubbleProps {
  /** Show the bubble (it pops in when this becomes true). */
  visible: boolean;
  children: ReactNode;
  /** Adds a waving hand after the text. */
  wave?: boolean;
  className?: string;
}

/** A small speech bubble the companion uses to greet people. */
export function GreetingBubble({ visible, children, wave = false, className }: GreetingBubbleProps) {
  if (!visible) return null;

  return (
    <p
      role="status"
      className={cn(
        "animate-bubble-pop w-max rounded-[18px] rounded-bl-md bg-surface px-3.5 py-2 font-heading text-label font-bold text-text shadow-floating",
        className,
      )}
    >
      {children}
      {wave ? (
        <span aria-hidden className="animate-wave-hand ml-1.5">
          👋
        </span>
      ) : null}
    </p>
  );
}
