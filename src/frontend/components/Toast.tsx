"use client";

import { useEffect } from "react";
import { cn } from "../lib/cn";

export interface ToastProps {
  message: string;
  onDismiss: () => void;
  durationMs?: number;
  className?: string;
}

export function Toast({ message, onDismiss, durationMs = 4000, className }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [onDismiss, durationMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-button bg-text px-5 py-3 font-heading text-label font-bold text-white shadow-floating md:bottom-8",
        className,
      )}
    >
      {message}
    </div>
  );
}
