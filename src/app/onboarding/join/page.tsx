"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Note, ScreenHeader } from "@/frontend/components";
import { cn } from "@/frontend/lib/cn";
import { useOnboarding } from "@/frontend/onboarding/OnboardingContext";
import { StepShell } from "@/frontend/onboarding/StepShell";
import { squadCodeSchema, squadNameSchema } from "@/frontend/onboarding/schemas";

type Mode = "join" | "create";

export default function OnboardingJoinPage() {
  const router = useRouter();
  const { update } = useOnboarding();
  const [mode, setMode] = useState<Mode>("join");
  const [code, setCode] = useState("");
  const [squadName, setSquadName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleContinue() {
    const result = mode === "join" ? squadCodeSchema.safeParse(code) : squadNameSchema.safeParse(squadName);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Check this and try again.");
      return;
    }
    // Squad membership is created by the backend later; nothing is joined
    // or created from this preview.
    update({ path: "squad" });
    router.push("/onboarding/ready");
  }

  return (
    <StepShell>
      <div className="flex flex-col gap-[18px]">
        <ScreenHeader kicker="Squad" title="Join or create a squad" onBack={() => router.back()} />
        <p className="font-heading text-body text-text-muted">A squad is up to 8 friends who grow alongside you. Sharing is always a choice.</p>

        <div role="tablist" aria-label="Squad option" className="flex gap-1 rounded-card bg-accent-tint p-1">
          {(["join", "create"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={mode === option}
              onClick={() => {
                setMode(option);
                setError(null);
              }}
              className={cn(
                "flex-1 rounded-[20px] py-2.5 font-heading text-label font-bold",
                mode === option ? "bg-surface text-accent-strong shadow-raised" : "text-text-muted",
              )}
            >
              {option === "join" ? "Join with a code" : "Create a squad"}
            </button>
          ))}
        </div>

        {mode === "join" ? (
          <Field
            label="Invite code"
            placeholder="e.g. NORTH-4821"
            autoCapitalize="characters"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setError(null);
            }}
            errorText={error ?? undefined}
          />
        ) : (
          <Field
            label="Squad name"
            placeholder="e.g. Northstar"
            value={squadName}
            onChange={(event) => {
              setSquadName(event.target.value.slice(0, 30));
              setError(null);
            }}
            helperText={`${squadName.length} / 30`}
            errorText={error ?? undefined}
          />
        )}

        <Note tone="tint">
          {mode === "join"
            ? "You’ll see who’s in the squad and exactly what they can see before you join."
            : "You’ll get an invite code to share once your squad is ready."}
        </Note>

        <Button variant="primary" onClick={handleContinue}>
          {mode === "join" ? "Continue" : "Create squad"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            update({ path: "solo" });
            router.push("/onboarding/ready");
          }}
        >
          Skip for now, go solo
        </Button>
        <p className="text-center font-heading text-meta text-text-muted">Preview only: squads connect when the squad service is ready.</p>
      </div>
    </StepShell>
  );
}
