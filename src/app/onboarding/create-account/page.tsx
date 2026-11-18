"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/frontend/components";
import { GoogleMark } from "@/frontend/components/GoogleMark";
import { AuthScene, SocialButtons } from "@/frontend/onboarding/AuthScene";
import { ClayField, ClayPasswordField } from "@/frontend/onboarding/ClayField";
import { OnboardingProgress } from "@/frontend/onboarding/OnboardingProgress";
import { useOnboarding } from "@/frontend/onboarding/OnboardingContext";
import { AppleMark, MailIcon } from "@/frontend/onboarding/icons";
import { emailSchema, passwordScore } from "@/frontend/onboarding/schemas";

const STRENGTH_LABEL = ["", "Keep going", "Getting there", "Good", "Strong"] as const;

export default function CreateAccountPage() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const [email, setEmail] = useState(data.email);
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const score = passwordScore(password);

  function handleCreate() {
    const validEmail = emailSchema.safeParse(email);
    let isValid = true;
    if (!validEmail.success) {
      setEmailError(validEmail.error.issues[0]?.message ?? "Enter a valid email.");
      isValid = false;
    }
    if (password.length < 8) {
      setPasswordError("Use at least 8 characters.");
      isValid = false;
    }
    if (!isValid || !validEmail.success) return;
    // Never store the password. The account itself is created by the
    // auth integration; this preview only carries the email forward.
    update({ email: validEmail.data });
    router.push("/onboarding/verify-email");
  }

  return (
    <AuthScene
      title="Join Momentum"
      subtitle="Start your journey, one small step at a time"
      greeting="Hi! I'm Ari"
      stage="child"
      topSlot={<OnboardingProgress step={1} />}
      footer={
        <p className="font-heading text-label text-text-muted">
          Already have an account?{" "}
          <Link href="/onboarding/sign-in" className="font-bold text-accent-strong">
            Log in
          </Link>
        </p>
      }
    >
      <form
        noValidate
        className="flex flex-col gap-3.5"
        onSubmit={(event) => {
          event.preventDefault();
          handleCreate();
        }}
      >
        <ClayField
          label="Email"
          icon={<MailIcon className="h-5 w-5" />}
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError(null);
          }}
          errorText={emailError ?? undefined}
        />
        <ClayPasswordField
          label="Password"
          autoComplete="new-password"
          placeholder="Password (8+ characters)"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setPasswordError(null);
          }}
          errorText={passwordError ?? undefined}
        />
        {password ? (
          <div className="flex items-center gap-1.5 px-2" aria-live="polite">
            {[1, 2, 3, 4].map((level) => (
              <span key={level} className={`h-1.5 flex-1 rounded-full ${level <= score ? "bg-success" : "bg-accent-tint"}`} />
            ))}
            <span className="ml-1 w-20 text-right font-heading text-meta text-success">{STRENGTH_LABEL[score]}</span>
          </div>
        ) : null}
        <Button type="submit" fullWidth={false} className="mt-1 w-full">
          Create account
        </Button>
      </form>

      {notice ? (
        <p role="status" className="text-center font-heading text-meta text-warning">
          {notice}
        </p>
      ) : null}

      <SocialButtons
        onSelect={(provider) =>
          setNotice(`${provider === "google" ? "Google" : "Apple"} sign-up will work once accounts are connected. No account was created.`)
        }
        google={<GoogleMark className="h-6 w-6" />}
        apple={<AppleMark className="h-6 w-6 text-text" />}
      />
      <p className="text-center font-heading text-meta text-text-muted">By continuing you agree to the Terms and Privacy Policy.</p>
    </AuthScene>
  );
}
