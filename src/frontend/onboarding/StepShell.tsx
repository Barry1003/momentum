import type { ReactNode } from "react";
import { cn } from "../lib/cn";

/** Centered column used by the onboarding steps after sign-up. */
export function StepShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <main className={cn("mx-auto min-h-dvh w-full max-w-[420px] px-4 pt-6 pb-10 md:max-w-[480px] md:px-0 md:pt-16", className)}>
      {children}
    </main>
  );
}
