"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { onboardingApi } from "@/frontend/onboarding/api";
import { Button, Field, Note, ScreenHeader } from "@/frontend/components";
import { CompanionDialogue } from "@/frontend/onboarding/CompanionDialogue";
import { useOnboarding } from "@/frontend/onboarding/OnboardingContext";
import { OnboardingProgress } from "@/frontend/onboarding/OnboardingProgress";
import { StepShell } from "@/frontend/onboarding/StepShell";
import { displayNameSchema } from "@/frontend/onboarding/schemas";

const GREETING = [
  "Hey! I'm Ari, your growth companion.",
  "We'll take this one small step at a time. I'm right here with you.",
  "First, what should I call you?",
] as const;

const NAME_HINT = "Use 2–24 letters, numbers or spaces.";

export default function YourNamePage() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const [name, setName] = useState(data.displayName);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleContinue() {
    const result = displayNameSchema.safeParse(name);
    if (!result.success) {
      setError(NAME_HINT);
      return;
    }
    setBusy(true); setError(null);
    try {
      await onboardingApi.save({ step: "name", displayName: result.data });
      update({ displayName: result.data });
      router.push("/onboarding/companion");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save your name."); }
    finally { setBusy(false); }
  }

  return (
    <StepShell>
    <div className="flex flex-col gap-[18px]">
      <OnboardingProgress step={3} />
      {error === NAME_HINT ? (
        // Figma 01b · Name check: a calm retry, with the rest of the step kept.
        <ScreenHeader title="Choose a name you like." subtitle="Your other choices are still here." onBack={() => router.back()} />
      ) : (
        <>
          <ScreenHeader title="What should I call you?" onBack={() => router.back()} />
          <p className="font-heading text-body text-text-muted">A nickname is welcome. No legal name needed.</p>
          <CompanionDialogue messages={GREETING} />
        </>
      )}

      <Field
        label="Display name"
        value={name}
        onChange={(event) => {
          setName(event.target.value.slice(0, 24));
          setError(null);
        }}
        helperText={`${name.length} / 24`}
        errorText={error ?? undefined}
      />
      {error === NAME_HINT ? null : <Note tone="tint">This is the name your squad sees, if you join one.</Note>}
      <Button variant="primary" disabled={busy} onClick={() => void handleContinue()}>Continue</Button>
    </div>
    </StepShell>
  );
}
