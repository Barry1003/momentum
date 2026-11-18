"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { onboardingApi } from "@/frontend/onboarding/api";
import { Button, ScreenHeader } from "@/frontend/components";
import { cn } from "@/frontend/lib/cn";
import { useOnboarding } from "@/frontend/onboarding/OnboardingContext";
import { OnboardingProgress } from "@/frontend/onboarding/OnboardingProgress";
import { StepShell } from "@/frontend/onboarding/StepShell";

const OPTIONS = [
  {
    value: "solo" as const,
    title: "On my own",
    description: "Grow at your own pace. You can invite friends later from Me.",
  },
  {
    value: "squad" as const,
    title: "With a squad",
    description: "Grow alongside up to 8 friends. Sharing is always a choice.",
  },
];

export default function OnboardingPathPage() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const [choice, setChoice] = useState(data.path);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!choice) return;
    setBusy(true); setError(null);
    try {
      await onboardingApi.save({ step: "path", path: choice });
      update({ path: choice });
      router.push(choice === "solo" ? "/onboarding/ready" : "/onboarding/join");
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to save your choice."); }
    finally { setBusy(false); }
  }

  return (
    <StepShell>
    <div className="flex flex-col gap-[18px]">
      <OnboardingProgress step={6} />
      <ScreenHeader kicker="Almost there" title="On your own, or with a squad?" onBack={() => router.back()} />

      <div className="flex flex-col gap-3">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setChoice(option.value)}
            aria-pressed={choice === option.value}
            className={cn(
              "rounded-card bg-surface p-5 text-left shadow-raised transition-colors duration-150",
              choice === option.value && "border-2 border-accent shadow-floating",
            )}
          >
            <p className="font-heading text-heading font-bold text-text">{option.title}</p>
            <p className="mt-1 font-heading text-body text-text-muted">{option.description}</p>
          </button>
        ))}
      </div>

      {error ? <p role="alert" className="font-heading text-meta text-warning">{error}</p> : null}
      <Button variant="primary" disabled={!choice || busy} onClick={() => void handleContinue()}>
        Continue
      </Button>
    </div>
    </StepShell>
  );
}
