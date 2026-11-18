"use client";

import { useRouter } from "next/navigation";
import { Button, StatsRow } from "@/frontend/components";
import { Companion } from "@/frontend/companion";
import { useOnboarding } from "@/frontend/onboarding/OnboardingContext";

export default function OnboardingReadyPage() {
  const router = useRouter();
  const { data } = useOnboarding();

  function finish() {
    // Preview-only state; backend session and squad membership are never
    // inferred from this value. Persist only non-sensitive UI preference.
    try {
      localStorage.setItem("momentum.hasVisited", "yes");
      localStorage.setItem("momentum.onboarding.previewComplete", "yes");
    } catch {
      // Storage can be unavailable in a private or restricted browser.
    }
    router.push(data.path === "squad" ? "/home" : "/my-space");
  }

  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <Companion stage="child" reaction="milestone" look={{ room: "lavender", outfit: "original" }} size="hero" />
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-title font-extrabold text-text md:text-display">
          {data.companionName || "Ari"} is ready to grow with you.
        </h1>
        <p className="font-heading text-body text-text-muted">
          {data.displayName ? `Welcome, ${data.displayName}.` : "Welcome."} Quiet days count too — growth never goes backwards here.
        </p>
      </div>
      <StatsRow className="w-full" stats={[{ value: "Child", label: "Stage" }, { value: "0 XP", label: "To start" }]} />
      <p className="text-center font-heading text-meta text-text-muted">Preview mode: your setup isn't saved to an account yet.</p>
      <Button variant="primary" onClick={finish}>
        {data.path === "squad" ? "Enter Squad Room preview" : "Go to My Space"}
      </Button>
    </div>
  );
}
