"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, Note, ScreenHeader } from "@/frontend/components";
import { Companion } from "@/frontend/companion";
import { useOnboarding } from "@/frontend/onboarding/OnboardingContext";

const CODE_LENGTH = 6;
const RESEND_SECONDS = 58;

export default function VerifyEmailPage() {
  const router = useRouter();
  const { data } = useOnboarding();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const code = digits.join("");
  const isComplete = code.length === CODE_LENGTH;

  function setDigit(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    setError(null);
    setDigits((previous) => {
      const next = [...previous];
      next[index] = value;
      return next;
    });
    if (value && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, CODE_LENGTH);
    if (!pasted) return;
    event.preventDefault();
    setDigits((previous) => {
      const next = [...previous];
      for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
      return next;
    });
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  function handleVerify() {
    if (!isComplete) return;
    if (code === "000000") {
      setError("That code didn't work — check and try again.");
      return;
    }
    router.push("/onboarding/name");
  }

  function handleResend() {
    setSecondsLeft(RESEND_SECONDS);
  }

  return (
    <div className="flex flex-col gap-5">
      <ScreenHeader kicker="Step 2 of 5" title="Check your inbox" onBack={() => router.back()} />

      <div className="flex items-center justify-center gap-2">
        <Companion stage="child" reaction="idle" look={{ room: "lavender", outfit: "original" }} size="card" />
      </div>

      <div className="flex items-center justify-between">
        <p className="font-heading text-meta text-text-muted">We sent a 6-digit code to {data.email || "your email"}.</p>
        <button type="button" className="shrink-0 font-heading text-meta font-bold text-accent-strong" onClick={() => router.push("/onboarding/create-account")}>
          Change
        </button>
      </div>

      <div className="flex gap-2.5">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            value={digit}
            onChange={(event) => setDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            inputMode="numeric"
            maxLength={1}
            aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
            className="h-[60px] w-full min-w-0 flex-1 rounded-[16px] bg-surface text-center font-display text-title font-extrabold text-text shadow-raised outline-none focus-visible:outline-2 focus-visible:outline-accent"
          />
        ))}
      </div>

      {error ? <p className="font-heading text-meta text-warning">{error}</p> : null}

      <div className="flex items-center gap-1.5 font-heading text-meta">
        <span className="text-text-muted">Didn&apos;t get it?</span>
        {secondsLeft > 0 ? (
          <span className="font-bold text-accent-strong">
            Resend in 0:{secondsLeft.toString().padStart(2, "0")}
          </span>
        ) : (
          <button type="button" onClick={handleResend} className="font-bold text-accent-strong">
            Resend
          </button>
        )}
      </div>

      <Note tone="tint">Check spam or promotions. The code works for 10 minutes.</Note>

      <Button variant="primary" disabled={!isComplete} onClick={handleVerify}>
        Verify and continue
      </Button>
      <p className="text-center font-heading text-meta text-text-muted">Button turns on when all 6 digits are in.</p>
    </div>
  );
}
