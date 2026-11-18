"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Companion, GreetingBubble } from "@/frontend/companion";
import { usePrefersReducedMotion } from "@/frontend/lib/usePrefersReducedMotion";
import { Cloud, Twinkle } from "@/frontend/onboarding/SceneDecor";
import { resolveLaunchDestination, type LaunchDestination, type LaunchIdentity } from "./resolveLaunchDestination";

/** How long the motion splash plays before moving on (unless skipped). */
const SPLASH_MS = 3200;
const REDUCED_MOTION_SPLASH_MS = 900;

async function resolveIdentity(): Promise<LaunchIdentity> {
  let visited = false;
  try {
    visited = localStorage.getItem("momentum.hasVisited") === "yes";
    localStorage.setItem("momentum.hasVisited", "yes");
  } catch {
    // Restricted storage should never prevent launch.
  }

  try {
    const response = await fetch("/api/me", { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) return { status: "signed-out", hasVisitedBefore: visited };
    const payload: unknown = await response.json();
    const value = payload as { user?: { id?: string }; profile?: { displayName?: string } | null };
    if (!value?.user?.id) return { status: "signed-out", hasVisitedBefore: visited };
    // Server identity is authoritative. Profile completion remains a
    // provisional UX decision until an onboarding API exists.
    return { status: "signed-in", onboardingComplete: Boolean(value.profile?.displayName), hasSquad: false };
  } catch {
    return { status: "signed-out", hasVisitedBefore: visited };
  }
}

/**
 * Motion splash: the three figures of the logo rise one by one, the gold
 * leader head pops and glows, the wordmark and tagline arrive, then Ari
 * peeks up and waves. Auth is checked in parallel; a local flag only picks
 * which public screen to suggest and never proves a session.
 */
export function LaunchScreen() {
  const router = useRouter();
  const reduceMotion = usePrefersReducedMotion();
  const [destination, setDestination] = useState<LaunchDestination>(null);
  const [isSplashDone, setIsSplashDone] = useState(false);
  const [hasWaved, setHasWaved] = useState(false);

  useEffect(() => {
    let active = true;
    void resolveIdentity().then((identity) => {
      if (active) setDestination(resolveLaunchDestination(identity));
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const done = window.setTimeout(() => setIsSplashDone(true), reduceMotion ? REDUCED_MOTION_SPLASH_MS : SPLASH_MS);
    const wave = window.setTimeout(() => setHasWaved(true), reduceMotion ? 0 : 2300);
    return () => {
      window.clearTimeout(done);
      window.clearTimeout(wave);
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (isSplashDone && destination) router.replace(destination);
  }, [destination, isSplashDone, router]);

  return (
    <main
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_38%,#fff9ef_0%,#efe6fd_55%,#dccff7_100%)] px-6 pb-40 text-center"
    >
      <Cloud className="top-[12%] left-[6%]" />
      <Cloud className="top-[22%] right-[4%] scale-75 [animation-delay:-3s]" />
      <Twinkle className="top-[30%] left-[22%]" />
      <Twinkle className="top-[18%] right-[26%] h-3.5 w-3.5 [animation-delay:-1s]" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative flex h-36 w-36 items-center justify-center rounded-[40px] bg-white/80 shadow-[0_24px_48px_rgba(76,49,155,.22),inset_0_2px_0_rgba(255,255,255,1),inset_0_-5px_0_rgba(214,200,240,.6)]">
          <span aria-hidden className="splash-ring absolute h-20 w-20 rounded-full border-4 border-[#ffcf6b]/70" />
          <svg viewBox="0 0 64.4 64.4" className="relative h-24 w-24" role="img" aria-label="Momentum">
            <defs>
              <radialGradient id="splash-gold" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(57.6581 12.075) scale(7.04375)">
                <stop stopColor="#FFFADB" />
                <stop offset="1" stopColor="#FFB840" />
              </radialGradient>
            </defs>
            <g className="splash-figure splash-figure-1">
              <path d="M2.0125 57.3562C2.0125 46.2875 8.05 40.7531 15.0937 40.7531C21.1312 40.7531 26.1625 44.7781 26.6656 49.8094C18.1125 52.325 10.0625 54.8406 2.0125 57.3562Z" fill="#B8A2F2" />
              <circle cx="15.0937" cy="31.1937" r="6.5406" fill="#B8A2F2" />
            </g>
            <g className="splash-figure splash-figure-2">
              <path d="M23.6469 49.3062C23.6469 36.225 30.1875 30.1875 37.2313 30.1875C44.275 30.1875 48.8031 35.7219 49.3063 41.7594C40.7531 43.7719 32.2 46.2875 23.6469 49.3062Z" fill="#8A63E0" />
              <circle cx="36.7281" cy="19.6219" r="7.0438" fill="#8A63E0" />
            </g>
            <g className="splash-figure splash-figure-3">
              <path d="M45.2812 41.2562C45.2812 28.6781 50.8156 21.6344 56.8531 21.6344C59.8719 21.6344 62.3875 23.1437 62.3875 23.1437V37.7344C56.8531 38.4387 50.8156 39.6462 45.2812 41.2562Z" fill="#4C319B" />
            </g>
            <circle className="splash-head" cx="54.8406" cy="8.5531" r="7.0438" fill="url(#splash-gold)" />
          </svg>
        </div>

        <p className="splash-word mt-6 font-display text-[40px] leading-none font-extrabold tracking-tight text-accent-strong">Momentum</p>
        <p className="splash-tagline mt-3 font-heading text-body text-text-muted">Small steps. Bigger you.</p>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center">
        <div className="splash-companion flex flex-col items-center">
        <GreetingBubble visible={hasWaved} wave className="mb-1">
          Hi! I&apos;m Ari
        </GreetingBubble>
        <Companion
          stage="child"
          reaction={hasWaved ? "hello" : "idle"}
          look={{ room: "lavender", outfit: "original" }}
          size="bust"
        />
        </div>
      </div>
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-20 rounded-t-[50%] bg-[#d3c3f4] shadow-[inset_0_4px_0_rgba(255,255,255,.5)]" />

      <button
        type="button"
        onClick={() => setIsSplashDone(true)}
        className="absolute top-5 right-5 z-20 rounded-full bg-white/70 px-4 py-2 font-heading text-meta font-bold text-accent-strong shadow-raised"
      >
        Skip
      </button>
      <p className="sr-only" role="status" aria-live="polite">
        {destination ? "Momentum is ready" : "Starting Momentum"}
      </p>
    </main>
  );
}
