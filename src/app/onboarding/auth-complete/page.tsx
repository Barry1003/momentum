"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/frontend/auth/client";
import { resolveAuthCompletion, type AuthCompletion } from "@/frontend/auth/complete";
import { useOnboarding } from "@/frontend/onboarding/OnboardingContext";
import { AuthScene } from "@/frontend/onboarding/AuthScene";

/**
 * A dedicated OAuth return page: checks Neon session first, then the
 * application's onboarding state. Never redirects failures to the splash.
 */
export default function AuthCompletePage() {
  const router = useRouter();
  const { update } = useOnboarding();
  const [result, setResult] = useState<AuthCompletion | null>(null);
  const [attempt, setAttempt] = useState(0);

  const check = useCallback(async () => {
    setResult(null);
    try {
      const sessionResult = await authClient.getSession();
      if (sessionResult.error) {
        setResult(resolveAuthCompletion({ session: "error" }));
        return;
      }
      const user = sessionResult.data?.user;
      if (!user) {
        setResult(resolveAuthCompletion({ session: "missing" }));
        return;
      }
      if (user.emailVerified === false) {
        update({ email: user.email });
        router.replace("/onboarding/verify-email");
        return;
      }

      const response = await fetch("/api/onboarding", { credentials: "same-origin", cache: "no-store" });
      const data = response.ok
        ? (await response.json() as { complete?: boolean; hasSquad?: boolean; destination?: string })
        : null;
      const decision = resolveAuthCompletion({
        session: "authenticated",
        emailVerified: user.emailVerified,
        onboardingStatus: response.status,
        complete: data?.complete,
        hasSquad: data?.hasSquad,
        destination: data?.destination,
      });
      if (decision.state === "navigate") {
        router.replace(decision.destination);
        router.refresh();
      } else setResult(decision);
    } catch {
      setResult(resolveAuthCompletion({ session: "error" }));
    }
  }, [router, update]);

  // Avoid depending on the unstable context.update function in this effect:
  // recheck only on explicit retry; see the guarded invocation below.
  useEffect(() => {
    void check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  return (
    <AuthScene title="Almost there" subtitle="Connecting your Momentum account" greeting="Welcome back!">
      {result ? (
        <div className="flex flex-col gap-4 text-center">
          <p role="alert" className="font-heading text-body text-text-muted">
            {result.state === "verify-email" ? "Verify your email to continue." : result.message}
          </p>
          {result.state === "retry" ? (
            <button type="button" onClick={() => setAttempt(value => value + 1)} className="rounded-full bg-accent-strong px-5 py-3 font-heading font-bold text-white">Retry connection</button>
          ) : null}
          <Link href="/onboarding/sign-in" className="font-heading font-bold text-accent-strong">Return to sign in</Link>
        </div>
      ) : (
        <p role="status" className="text-center font-heading text-body text-text-muted">Checking your secure session…</p>
      )}
    </AuthScene>
  );
}
