"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { authClient } from "@/frontend/auth/client";
import { Button, Field, Note, ScreenHeader } from "@/frontend/components";
import { useOnboarding } from "@/frontend/onboarding/OnboardingContext";
import { StepShell } from "@/frontend/onboarding/StepShell";
import { emailSchema } from "@/frontend/onboarding/schemas";

const SUPPORT = "mailto:support@momentum.app?subject=I%20no%20longer%20use%20my%20Momentum%20email";

function HelpRow({ icon, title, detail, onClick, href }: { icon: ReactNode; title: string; detail: string; onClick?: () => void; href?: string }) {
  const inner = (
    <>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#ffffff,#e2d8f8)] text-accent-strong shadow-raised">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-heading text-body font-bold text-text">{title}</span>
        <span className="block truncate font-heading text-meta text-text-muted">{detail}</span>
      </span>
      <svg aria-hidden viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-text-muted">
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </>
  );
  const className = "flex w-full items-center gap-3 py-3 text-left";
  return (
    <li>
      {href ? (
        <a href={href} className={className}>
          {inner}
        </a>
      ) : (
        <button type="button" onClick={onClick} className={className}>
          {inner}
        </button>
      )}
    </li>
  );
}

/** Figma 01b · Can’t get in: a one-time sign-in code, or support when the email is gone. */
export default function CantGetInPage() {
  const router = useRouter();
  const { data } = useOnboarding();
  const [email, setEmail] = useState(data.email);
  const [step, setStep] = useState<"choose" | "code">("choose");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const requestReset = async () => {
    const valid = emailSchema.safeParse(email);
    if (!valid.success) {
      setError("Enter the email you signed up with.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await authClient.requestPasswordReset({ email: valid.data, redirectTo: `${window.location.origin}/onboarding/reset-password` });
      setResetSent(true);
    } catch {
      setError("Could not request a reset link. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async () => {
    const valid = emailSchema.safeParse(email);
    if (!valid.success) {
      setError("Enter the email you signed up with.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await authClient.emailOtp.sendVerificationOtp({ email: valid.data });
      if (response.error) {
        setError(response.error.message || "We couldn’t send a code. Try again in a minute.");
        return;
      }
      setEmail(valid.data);
      setStep("code");
    } catch {
      setError("We couldn’t send a code. Try again in a minute.");
    } finally {
      setBusy(false);
    }
  };

  const signIn = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await authClient.signIn.emailOtp({ email, otp: code });
      if (response.error) {
        setError(response.error.message || "That code didn’t work.");
        return;
      }
      router.replace("/onboarding");
      router.refresh();
    } catch {
      setError("We couldn’t sign you in. Try again.");
    } finally {
      setBusy(false);
    }
  };

  if (step === "code") {
    return (
      <StepShell>
        <div className="flex flex-col gap-5">
          <ScreenHeader kicker="Account help" title="Check your inbox." subtitle={`If ${email} has an account, a sign-in code is on its way.`} onBack={() => setStep("choose")} />
          <Field
            label="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => {
              setError(null);
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
            }}
            errorText={error ?? undefined}
          />
          <Button variant="primary" disabled={busy || code.length !== 6} onClick={() => void signIn()}>
            Sign in
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => void sendCode()}>
            Send another code
          </Button>
          <Note tone="tint">We never ask for your password in chat or email.</Note>
        </div>
      </StepShell>
    );
  }

  return (
    <StepShell>
      <div className="flex flex-col gap-5">
        <ScreenHeader kicker="Account help" title="Need another way in?" subtitle="We’ll keep your account safe." onBack={() => router.back()} />
        {data.email ? null : (
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setError(null);
              setEmail(event.target.value);
            }}
            placeholder="ari@example.com"
          />
        )}
        <section className="rounded-[26px] bg-surface px-4 py-1 shadow-raised">
          <ul className="divide-y divide-[#ece6f6]">
            <HelpRow
              onClick={() => void sendCode()}
              icon={
                <svg aria-hidden viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />
                </svg>
              }
              title={busy ? "Sending…" : "Send a sign-in code"}
              detail={email ? `To ${email}` : "To the email you signed up with"}
            />
            <HelpRow
              href={SUPPORT}
              icon={
                <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-5 w-5">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
                </svg>
              }
              title="I no longer use that email"
              detail="Contact support with proof it’s you"
            />
          </ul>
        </section>
        {error ? (
          <p role="alert" className="font-heading text-meta text-warning">
            {error}
          </p>
        ) : null}
        <Note tone="tint">We never ask for your password in chat or email.</Note>
        {resetSent ? (
          <Note tone="success" title="Reset link requested">
            If an account exists for that email, a password reset link is on its way.
          </Note>
        ) : (
          <button type="button" disabled={busy} onClick={() => void requestReset()} className="text-center font-heading text-meta font-bold text-accent-strong">
            Email me a password reset link instead
          </button>
        )}
      </div>
    </StepShell>
  );
}
