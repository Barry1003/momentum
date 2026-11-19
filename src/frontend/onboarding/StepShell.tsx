"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button, Note, ScreenHeader } from "../components";
import { cn } from "../lib/cn";
import { useOnline } from "../lib/useOnline";

/** Figma 01b · Onboarding · Offline. The step stays mounted underneath, so nothing typed is lost. */
function OfflineStep() {
  const router = useRouter();
  const [stillOffline, setStillOffline] = useState(false);
  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader kicker="No connection" title="Your place is safe." subtitle="There’s no connection right now." onBack={() => router.back()} />
      <Note tone="warning" title="Nothing was sent">
        Your email and choices are kept on this screen. Try again when you’re back online.
      </Note>
      <Button variant="primary" onClick={() => setStillOffline(navigator.onLine === false)}>
        Try again
      </Button>
      {stillOffline ? (
        <p role="status" className="text-center font-heading text-meta text-text-muted">
          Still offline. This screen comes back by itself once you reconnect.
        </p>
      ) : null}
    </div>
  );
}

/** Centered column used by the onboarding steps after sign-up. */
export function StepShell({ children, className }: { children: ReactNode; className?: string }) {
  const online = useOnline();
  return (
    <main className={cn("mx-auto min-h-dvh w-full max-w-[420px] px-4 pt-6 pb-10 md:max-w-[480px] md:px-0 md:pt-16", className)}>
      {online ? null : <OfflineStep />}
      <div hidden={!online}>{children}</div>
    </main>
  );
}
