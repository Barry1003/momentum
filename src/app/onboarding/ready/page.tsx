"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, StatsRow } from "@/frontend/components";
import { Companion, GreetingBubble, type CompanionReaction } from "@/frontend/companion";
import { useOnboarding } from "@/frontend/onboarding/OnboardingContext";
import { onboardingApi } from "@/frontend/onboarding/api";
import { Twinkle } from "@/frontend/onboarding/SceneDecor";
import { StepShell } from "@/frontend/onboarding/StepShell";

export default function OnboardingReadyPage() {
  const router = useRouter();
  const { data } = useOnboarding();
  const [reaction, setReaction] = useState<CompanionReaction>("idle");
  const [hasCheered, setHasCheered] = useState(false);
  const companionName = data.companionName || "Ari";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setReaction("milestone");
      setHasCheered(true);
    }, 400);
    return () => window.clearTimeout(timer);
  }, []);

  async function finish() {
    setBusy(true); setError(null);
    try {
      const saved = await onboardingApi.complete();
      try { localStorage.setItem("momentum.hasVisited", "yes"); } catch { /* restricted storage */ }
      router.replace(saved.destination);
      router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to finish setup."); }
    finally { setBusy(false); }
  }

  return (
    <StepShell>
      <div className="flex flex-col items-center gap-5 py-6 text-center">
        <div className="relative flex w-full justify-center rounded-card bg-cream pt-10 shadow-floating">
          <Twinkle className="top-6 left-8" />
          <Twinkle className="top-14 right-10 h-3.5 w-3.5 [animation-delay:-1s]" />
          <Twinkle className="top-28 left-16 h-3 w-3 [animation-delay:-.6s]" />
          <GreetingBubble visible={hasCheered} className="absolute top-4 right-6">
            We did it! 🎉
          </GreetingBubble>
          <Companion
            stage="child"
            reaction={reaction}
            look={{ room: "lavender", outfit: "original" }}
            size="hero"
            onTap={() => {
              setReaction("idle");
              window.requestAnimationFrame(() => setReaction("hello"));
            }}
            onReactionEnd={() => setReaction("idle")}
            followPointer
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-title font-extrabold text-text md:text-display">{companionName} is ready to grow with you.</h1>
          <p className="font-heading text-body text-text-muted">
            {data.displayName ? `Welcome, ${data.displayName}.` : "Welcome."} Quiet days count too — growth never goes backwards here.
          </p>
        </div>
        <StatsRow className="w-full" stats={[{ value: "Child", label: "Stage 1 of 5" }, { value: "0 XP", label: "To start" }]} />
        <p className="text-center font-heading text-meta text-text-muted">Your setup is saved securely to your account.</p>
        {error ? <p role="alert" className="font-heading text-meta text-warning">{error}</p> : null}
        <Button variant="primary" disabled={busy} onClick={() => void finish()}>
          {data.path === "squad" ? "Enter the Squad Room" : "Go to My Space"}
        </Button>
      </div>
    </StepShell>
  );
}
