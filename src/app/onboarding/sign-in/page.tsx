"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/frontend/components";
import { GoogleMark } from "@/frontend/components/GoogleMark";
import { AuthScene, SocialButtons } from "@/frontend/onboarding/AuthScene";
import { ClayField, ClayPasswordField } from "@/frontend/onboarding/ClayField";
import { AppleMark, MailIcon } from "@/frontend/onboarding/icons";
import { emailSchema } from "@/frontend/onboarding/schemas";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function handleLogin() {
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setEmailError(result.error.issues[0]?.message ?? "Enter your email.");
      return;
    }
    if (!password) {
      setNotice("Enter your password to log in.");
      return;
    }
    // Authentication is a separate backend decision; never fake a session.
    setNotice("Log in isn’t connected yet in this preview. Nothing was sent.");
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
        <Button type="submit" fullWidth={false} className="w-full">
          Log in
        </Button>
      </form>

      {notice ? (
        <p role="status" className="text-center font-heading text-meta text-warning">
          {notice}
        </p>
      ) : null}

      <SocialButtons
        onSelect={(provider) =>
          setNotice(`${provider === "google" ? "Google" : "Apple"} sign-in will work once accounts are connected. No account was used.`)
        }
        google={<GoogleMark className="h-6 w-6" />}
        apple={<AppleMark className="h-6 w-6 text-text" />}
      />
    </AuthScene>
  );
}
