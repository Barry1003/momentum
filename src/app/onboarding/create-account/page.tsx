"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/frontend/auth/client";
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
  const [busy, setBusy] = useState(false);
  const [canRetryVerification, setCanRetryVerification] = useState(false);

  async function handleCreate() {
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
    setBusy(true);
    setNotice(null);
    setCanRetryVerification(false);
    try {
      const response = await authClient.signUp.email({
        email: validEmail.data, password, name: "Momentum member",
      });
      if (response.error) {
        // The user may already have an unverified account from an earlier attempt.
        // Allow OTP recovery instead of forcing a second signup.
        setCanRetryVerification(true);
        setNotice(response.error.message || "Could not create your account. If you already signed up, request a verification code below.");
        return;
      }
      // Record the verified target before sending so retries never recreate the account.
      update({ email: validEmail.data });
      setPassword("");
      const sent = await authClient.emailOtp.sendVerificationOtp({
        email: validEmail.data, type: "email-verification",
      });
      if (sent.error) {
        setCanRetryVerification(true);
        setNotice("Your account was created, but the verification email could not be sent. Check email delivery settings or retry below.");
        return;
      }
      router.push("/onboarding/verify-email");
    } catch {
      // Network failure can happen after account creation. Do not claim the
      // account definitely failed, and offer an OTP resend without creating it again.
      setCanRetryVerification(true);
      setNotice("We could not finish signup. If your account was created, you can request a verification code below.");
    } finally {
      setBusy(false);
    }
  }

  async function retryVerification() {
    const valid = emailSchema.safeParse(email);
    if (!valid.success || busy) {
      setEmailError("Enter a valid email to receive your verification code.");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const response = await authClient.emailOtp.sendVerificationOtp({
        email: valid.data, type: "email-verification",
      });
      if (response.error) {
        setNotice("We could not send the verification code. Check the email service and try again.");
        return;
      }
      update({ email: valid.data });
      router.push("/onboarding/verify-email");
    } catch {
      setNotice("The code could not be sent. Please check your connection and try again.");
    } finally { setBusy(false); }
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
        <Button type="submit" disabled={busy} fullWidth={false} className="mt-1 w-full">
          Create account
        </Button>
      </form>

      {notice ? (
        <p role="alert" className="text-center font-heading text-meta text-warning">
          {notice}
        </p>
      ) : null}
      {canRetryVerification ? (
        <Button type="button" variant="secondary" disabled={busy} onClick={() => void retryVerification()}>
          Send verification code
        </Button>
      ) : null}

      <SocialButtons
        onSelect={async (provider) => {
          if (provider === "apple") {
            setNotice("Apple sign-in is not available yet. Use Google or email.");
            return;
          }
          setBusy(true);
          try {
            const response = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
            if (response.error) setNotice(response.error.message || "Google sign-in failed.");
          } catch { setNotice("Could not start Google sign-in."); }
          finally { setBusy(false); }
        }}
        google={<GoogleMark className="h-6 w-6" />}
        apple={<AppleMark className="h-6 w-6 text-text" />}
      />
      <p className="text-center font-heading text-meta text-text-muted">By continuing you agree to the Terms and Privacy Policy.</p>
    </AuthScene>
  );
}
