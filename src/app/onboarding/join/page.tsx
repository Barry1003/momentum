"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { onboardingApi } from "@/frontend/onboarding/api";
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
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ squadName: string; memberCount: number; available: boolean; full: boolean } | null>(null);

  async function handleContinue() {
    const parsed = mode === "join" ? squadCodeSchema.safeParse(code) : squadNameSchema.safeParse(squadName);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check this and try again.");
      return;
    }
    setBusy(true); setError(null);
    try {
      if (mode === "join") {
        const token = squadCodeSchema.parse(code);
        if (!preview) {
          const result = await onboardingApi.previewInvitation(token);
          setPreview(result.invitation);
          if (!result.invitation.available) setError("This invitation is unavailable or the squad is full.");
          return;
        }
        if (!preview.available) return;
        await onboardingApi.acceptInvitation(token);
      } else {
        await onboardingApi.createSquad(squadNameSchema.parse(squadName));
      }
      await onboardingApi.save({ step: "path", path: "squad" });
      update({ path: "squad" });
      router.push("/onboarding/ready");
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to join or create the squad."); }
    finally { setBusy(false); }
  }

  async function goSolo() {
    setBusy(true); setError(null);
    try {
      await onboardingApi.save({ step: "path", path: "solo" });
      update({ path: "solo" });
      router.push("/onboarding/ready");
    } catch (error) { setError(error instanceof Error ? error.message : "Could not save your choice."); }
    finally { setBusy(false); }
  }

  return (
    <StepShell>
      <div className="flex flex-col gap-[18px]">
        <ScreenHeader kicker="Squad" title="Join or create a squad" onBack={() => router.back()} />
        <p className="font-heading text-body text-text-muted">A squad is for up to 8 friends who grow alongside you. Sharing is always a choice.</p>

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
                setPreview(null);
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
            placeholder="Paste your secure invite code"
            autoCapitalize="characters"
            value={code}
            onChange={(event) => {
              setCode(event.target.value);
              setError(null);
              setPreview(null);
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

        {preview && mode === "join" ? <Note tone="tint" title={preview.squadName}>This squad has {preview.memberCount} members. {preview.available ? "Join to continue." : "This invitation is unavailable."}</Note> : null}
        <Note tone="tint">
          {mode === "join"
            ? "You’ll see who’s in the squad and exactly what they can see before you join."
            : "You’ll get an invite code to share once your squad is ready."}
        </Note>

        <Button variant="primary" disabled={busy || (preview !== null && !preview.available)} onClick={() => void handleContinue()}>
          {mode === "join" ? (preview ? "Join squad" : "Preview squad") : "Create squad"}
        </Button>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => void goSolo()}
        >
          Skip for now, go solo
        </Button>
        <p className="text-center font-heading text-meta text-text-muted">Squad access is saved to your account.</p>
      </div>
    </StepShell>
  );
}
