"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/frontend/auth/client";
import { useState } from "react";
import { Button } from "@/frontend/components";
import { GoogleMark } from "@/frontend/components/GoogleMark";
import { AuthScene, SocialButtons } from "@/frontend/onboarding/AuthScene";
import { ClayField, ClayPasswordField } from "@/frontend/onboarding/ClayField";
import { AppleMark, MailIcon } from "@/frontend/onboarding/icons";
import { emailSchema } from "@/frontend/onboarding/schemas";

export default function SignInPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleLogin() {
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setEmailError(result.error.issues[0]?.message ?? "Enter your email.");
      return;
    }
    if (!password) {
      setNotice("Enter your password to log in.");
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const response = await authClient.signIn.email({ email: result.data, password });
      if (response.error) {
        setNotice(response.error.message || "Unable to sign in. Check your details.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch { setNotice("Could not contact the account service."); }
    finally { setBusy(false); }
  }

  return (
    <AuthScene
      title="Welcome Back"
      subtitle="Log in to continue your journey"
      greeting="Welcome back!"
      footer={
        <p className="font-heading text-label text-text-muted">
          Don&apos;t have an account?{" "}
          <Link href="/onboarding/create-account" className="font-bold text-accent-strong">
            Sign up
          </Link>
        </p>
      }
    >
      <form
        noValidate
        className="flex flex-col gap-3.5"
        onSubmit={(event) => {
          event.preventDefault();
          handleLogin();
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
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setNotice(null);
          }}
        />
        <Link href="/onboarding/cant-get-in" className="self-end pr-2 font-heading text-meta font-bold text-accent-strong">
          Forgot password?
        </Link>
        <Button type="submit" disabled={busy} fullWidth={false} className="w-full">
          Log in
        </Button>
      </form>

      {notice ? (
        <p role="status" className="text-center font-heading text-meta text-warning">
          {notice}
        </p>
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
    </AuthScene>
  );
}
