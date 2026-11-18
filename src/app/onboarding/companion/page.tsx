"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, FaceAvatar, ScreenHeader, Tag } from "@/frontend/components";
import { Companion, GreetingBubble, useGreeting } from "@/frontend/companion";
import { cn } from "@/frontend/lib/cn";
import { useOnboarding } from "@/frontend/onboarding/OnboardingContext";
import { companionNameSchema } from "@/frontend/onboarding/schemas";
import { OnboardingProgress } from "@/frontend/onboarding/OnboardingProgress";
import { StepShell } from "@/frontend/onboarding/StepShell";
import boyFace from "@/frontend/assets/companion/ari-child-face.png";
import girlFace from "@/frontend/assets/faces/zara-face.png";

const LOOK_FACE = { boy: boyFace, girl: girlFace } as const;

export default function CreateCompanionPage() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const [style, setStyle] = useState(data.companionStyle);
  const [look, setLook] = useState(data.companionLook);
  const [name, setName] = useState(data.companionName);
  const [error, setError] = useState<string | null>(null);
  const greeting = useGreeting(500);

  function handleContinue() {
    const result = companionNameSchema.safeParse(name);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Name your companion.");
      return;
    }
    update({ companionStyle: style, companionLook: look, companionName: result.data });
    router.push("/onboarding/privacy");
  }

  return (
    <StepShell>
    <div className="flex flex-col gap-5">
      <OnboardingProgress step={4} />
      <ScreenHeader
        title={<>Who is growing<br />with you?</>}
        subtitle="Your companion starts small and grows as you show up. Growth is earned and never lost."
        onBack={() => router.back()}
      />

      <div className="flex gap-1 rounded-card bg-accent-tint p-1">
        {(["anime", "soft3d"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setStyle(option)}
            className={cn(
              "flex-1 rounded-[20px] py-2.5 font-heading text-label font-bold",
              style === option ? "bg-surface text-accent-strong shadow-raised" : "text-text-muted",
            )}
          >
            {option === "anime" ? "Anime" : "Soft 3D"}
          </button>
        ))}
      </div>

      <div className="relative flex h-[300px] flex-col items-center justify-end overflow-hidden rounded-card bg-cream shadow-floating">
        <Tag tone="white" className="absolute top-4 left-4">
          Starts as Child · 5 stages ahead
        </Tag>
        <GreetingBubble visible={greeting.hasGreeted} wave className="absolute top-[64px] right-4 max-w-[150px]">
          Hi! Let&apos;s grow together.
        </GreetingBubble>
        {look === "boy" ? (
          <Companion
            stage="child"
            reaction={greeting.reaction}
            look={{ room: "lavender", outfit: "original" }}
            size="hero"
            onTap={greeting.sayHello}
            onReactionEnd={greeting.onReactionEnd}
            followPointer
          />
        ) : (
          // Girl full-body stage art isn't exported from Figma yet
          // (page 02, "Source / Anime Female / 5 Stages"); show her portrait.
          <button
            type="button"
            onClick={greeting.sayHello}
            aria-label="Say hi to your companion"
            className={cn("mb-10 rounded-full", greeting.reaction === "hello" ? "animate-companion-hello" : "animate-companion-idle")}
            onAnimationEnd={greeting.onReactionEnd}
          >
            <FaceAvatar name="Girl companion" src={LOOK_FACE.girl} size={150} />
          </button>
        )}
      </div>

      <p className="font-heading text-label font-bold text-text">Choose a look</p>
      <div className="flex gap-3">
        {(["boy", "girl"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setLook(option)}
            aria-pressed={look === option}
            className={cn(
              "flex flex-1 items-center gap-3 rounded-card bg-surface py-2.5 pr-3.5 pl-2.5 shadow-raised",
              look === option && "border-2 border-accent shadow-floating",
            )}
          >
            <FaceAvatar name={option === "boy" ? "Boy" : "Girl"} src={LOOK_FACE[option]} size={52} />
            <span className={cn("font-heading text-label font-bold", look === option ? "text-accent-strong" : "text-text")}>
              {option === "boy" ? "Boy" : "Girl"}
            </span>
          </button>
        ))}
      </div>

      <Field
        label="Name your companion"
        value={name}
        onChange={(event) => {
          setName(event.target.value.slice(0, 20));
          setError(null);
        }}
        helperText={`${name.length} / 20`}
        errorText={error ?? undefined}
      />

      <p className="font-heading text-meta text-text-muted">You can change style, look and name anytime in Me.</p>

      <Button variant="primary" onClick={handleContinue}>
        Meet {name || "your companion"}
      </Button>
      <button type="button" onClick={() => router.back()} className="font-heading text-label font-bold text-text-muted">
        Back
      </button>
    </div>
    </StepShell>
  );
}
