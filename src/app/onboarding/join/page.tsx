"use client";

import { useRouter } from "next/navigation";
import { Button, Note, ScreenHeader } from "@/frontend/components";

export default function OnboardingJoinPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-[18px]">
      <ScreenHeader kicker="Squad" title="Join or create a squad" onBack={() => router.back()} />

      <Note tone="tint">
        The full squad invite flow (find a circle, create one, join with a code) lands with the Squad section.
        For now, continue solo — you can start or join a squad anytime from Me.
      </Note>

      <Button variant="primary" onClick={() => router.push("/onboarding/ready")}>
        Continue solo for now
      </Button>
    </div>
  );
}
