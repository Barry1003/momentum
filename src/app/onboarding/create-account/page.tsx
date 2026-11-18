"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, ScreenHeader } from "@/frontend/components";
import { useOnboarding } from "@/frontend/onboarding/OnboardingContext";
import { emailSchema } from "@/frontend/onboarding/schemas";

export default function CreateAccountPage() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const [email, setEmail] = useState(data.email);
  const [error, setError] = useState<string | null>(null);

  function handleContinueWithGoogle() {
    update({ email: "ari@example.com" });
    router.push("/onboarding/name");
  }

  function handleCreateAccount() {
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Enter a valid email.");
      return;
    }
    update({ email: result.data });
    router.push("/onboarding/verify-email");
  }

  return (
    <div className="flex flex-col gap-[18px]">
      <ScreenHeader kicker="Step 1 of 5" title="Create your account" subtitle="Your space is private from the first minute." />

      <Button variant="secondary" onClick={handleContinueWithGoogle}>
        Continue with Google
      </Button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-outline" />
        <span className="font-heading text-meta text-text-muted">or with email</span>
        <div className="h-px flex-1 bg-outline" />
      </div>

      <Field
        label="Email"
        type="email"
        placeholder="ari@example.com"
        value={email}
        onChange={(event) => {
          setEmail(event.target.value);
          setError(null);
        }}
        errorText={error ?? undefined}
      />

      <p className="text-center font-heading text-meta text-text-muted">
        By continuing you agree to the Terms and Privacy Policy.
      </p>

      <Button variant="primary" onClick={handleCreateAccount}>
        Create account
      </Button>

      <p className="text-center font-heading text-meta text-text-muted">
        Already have an account?{" "}
        <Link href="/onboarding/sign-in" className="font-bold text-accent-strong">
          Sign in
        </Link>
      </p>
    </div>
  );
}
