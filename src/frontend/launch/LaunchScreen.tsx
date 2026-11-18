"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/frontend/components/Logo";
import { resolveLaunchDestination, type LaunchIdentity } from "./resolveLaunchDestination";

/**
 * Animated app entry. Auth is checked via the server when available.
 * A local welcome flag only controls which public screen is suggested;
 * it never proves a user is signed in or unlocks protected content.
 */
export function LaunchScreen() {
  const router = useRouter();
  const [message, setMessage] = useState("Starting Momentum");

  useEffect(() => {
    let active = true;
    const launchedAt = Date.now();

    async function start() {
      let identity: LaunchIdentity;
      let visited = false;
      try {
        visited = localStorage.getItem("momentum.hasVisited") === "yes";
        localStorage.setItem("momentum.hasVisited", "yes");
      } catch {
        // Restricted storage should never prevent launch.
      }

      try {
        const response = await fetch("/api/me", { credentials: "same-origin", cache: "no-store" });
        if (!response.ok) {
          identity = { status: "signed-out", hasVisitedBefore: visited };
        } else {
          const payload: unknown = await response.json();
          const value = payload as { user?: { id?: string }; profile?: { displayName?: string } | null };
          if (!value?.user?.id) {
            identity = { status: "signed-out", hasVisitedBefore: visited };
          } else {
            // Server identity is authoritative. Profile completion remains a
            // provisional UX decision until an onboarding API exists.
            identity = {
              status: "signed-in",
              onboardingComplete: Boolean(value.profile?.displayName),
              hasSquad: false,
            };
          }
        }
      } catch {
        identity = { status: "signed-out", hasVisitedBefore: visited };
      }

      const destination = resolveLaunchDestination(identity);
      const remainder = Math.max(0, 1200 - (Date.now() - launchedAt));
      await new Promise<void>((resolve) => window.setTimeout(resolve, remainder));
      if (!active || !destination) return;
      setMessage("Ready");
      router.replace(destination);
    }

    void start();
    return () => { active = false; };
  }, [router]);

  return (
    <main className="momentum-launch relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="momentum-launch-glow" aria-hidden="true" />
      <div className="momentum-launch-mark relative z-10 flex flex-col items-center gap-7">
        <div className="rounded-[32px] bg-white/75 p-6 shadow-floating">
          <Logo className="scale-[1.5]" />
        </div>
        <div>
          <h1 className="font-display text-title font-extrabold text-text">Small steps. Bigger you.</h1>
          <p className="mt-2 font-heading text-body text-text-muted">Grow together, every day.</p>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-10 flex items-center justify-center gap-2" role="status" aria-live="polite">
        <span className="momentum-launch-dot size-2 rounded-full bg-accent" aria-hidden="true" />
        <span className="font-heading text-meta text-text-muted">{message}</span>
      </div>
    </main>
  );
}
