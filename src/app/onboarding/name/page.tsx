"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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

export default function YourNamePage() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const [name, setName] = useState(data.displayName);
  const [error, setError] = useState<string | null>(null);

  function handleContinue() {
    const result = displayNameSchema.safeParse(name);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter a display name.");
      return;
    }
    update({ displayName: result.data });
    router.push("/onboarding/companion");
  }

  return (
    <StepShell>
    <div className="flex flex-col gap-[18px]">
      <OnboardingProgress step={3} />
      <ScreenHeader title="What should I call you?" onBack={() => router.back()} />
      <p className="font-heading text-body text-text-muted">A nickname is welcome. No legal name needed.</p>
      <CompanionDialogue messages={GREETING} />

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
      <Note tone="tint">This is the name your squad sees, if you join one.</Note>
      <Button variant="primary" onClick={handleContinue}>Continue</Button>
    </div>
    </StepShell>
  );
}
