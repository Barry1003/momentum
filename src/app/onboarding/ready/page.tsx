"use client";

import { LinkButton, StatsRow } from "@/frontend/components";
import { Companion } from "@/frontend/companion";
import { useOnboarding } from "@/frontend/onboarding/OnboardingContext";

export default function OnboardingReadyPage() {
  const { data } = useOnboarding();

  return (
    <div className="flex flex-col items-center gap-5 py-6 text-center">
      <Companion
        stage="child"
        reaction="milestone"
        look={{ room: "lavender", outfit: "original" }}
        size="hero"
      />

      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-title font-extrabold text-text md:text-display">
          {data.companionName || "Ari"} is ready to grow with you.
        </h1>
        <p className="font-heading text-body text-text-muted">
          {data.displayName ? `Welcome, ${data.displayName}.` : "Welcome."} Quiet days count too — growth never goes
          backwards here.
        </p>
      </div>

      <StatsRow className="w-full" stats={[{ value: "Child", label: "Stage" }, { value: "0 XP", label: "To start" }]} />

      <LinkButton href="/" variant="primary" className="w-full">
        Go to My Space
      </LinkButton>
    </div>
  );
}
