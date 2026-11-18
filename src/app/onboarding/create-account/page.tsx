"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field } from "@/frontend/components";
import { GoogleMark } from "@/frontend/components/GoogleMark";
import { useOnboarding } from "@/frontend/onboarding/OnboardingContext";
import { displayNameSchema, emailSchema } from "@/frontend/onboarding/schemas";

export default function CreateAccountPage() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const [name, setName] = useState(data.displayName);
  const [email, setEmail] = useState(data.email);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleNotice, setGoogleNotice] = useState(false);
  const strong = password.length >= 12 && /[a-z]/i.test(password) && /\d/.test(password);
  const passwordScore = [password.length >= 8, password.length >= 12, /[A-Z]/.test(password) && /[a-z]/.test(password), /\d/.test(password) && /[^\w\s]/.test(password)].filter(Boolean).length;

  function handleContinue() {
    const validName = displayNameSchema.safeParse(name);
    const validEmail = emailSchema.safeParse(email);
    if (!validName.success) { setError(validName.error.issues[0]?.message ?? "Enter your name."); return; }
    if (!validEmail.success) { setError(validEmail.error.issues[0]?.message ?? "Enter a valid email."); return; }
    if (password.length < 8) { setError("Use a password of at least 8 characters."); return; }
    // Do not store passwords or pretend an account was created. This is a
    // visual onboarding preview pending the separate auth integration.
    update({ email: validEmail.data, displayName: validName.data });
    router.push("/onboarding/verify-email");
  }

  return (
    <div className="flex min-h-[calc(100dvh-6rem)] flex-col gap-6">
      <div className="flex items-center gap-2 pt-3" aria-label="Onboarding step 1 of 5">
        {[0,1,2,3,4].map(i => <span key={i} className={`h-1.5 flex-1 rounded-full ${i===0 ? "bg-[image:var(--gradient-primary)]" : "bg-accent-tint"}`} />)}
        <span className="ml-1 shrink-0 font-heading text-meta text-text-muted">1 of 5</span>
      </div>
      <header>
        <h1 className="font-display text-display font-extrabold text-text">Create your account</h1>
        <p className="mt-2 font-heading text-body text-text-muted">Your space is private from the first minute.</p>
      </header>
      <button type="button" onClick={() => setGoogleNotice(true)} className="flex items-center justify-center gap-3 rounded-button bg-surface px-5 py-4 font-heading text-label font-bold text-text shadow-raised">
        <GoogleMark className="size-5" /> Continue with Google
      </button>
      {googleNotice ? <p className="font-heading text-meta text-warning" role="status">Google sign-in will be available when the authentication service is connected. No account has been created.</p> : null}
      <div className="flex items-center gap-3"><span className="h-px flex-1 bg-outline" /><span className="font-heading text-meta text-text-muted">or with email</span><span className="h-px flex-1 bg-outline" /></div>

      <div className="flex flex-col gap-5">
        <Field label="Your name" value={name} onChange={event => { setName(event.target.value); setError(null); }} placeholder="Ari Okafor" />
        <Field label="Email" type="email" value={email} onChange={event => { setEmail(event.target.value); setError(null); }} placeholder="ari@example.com" />
        <div className="flex flex-col gap-2">
          <label htmlFor="momentum-signup-password" className="font-heading text-label font-bold text-text">Password</label>
          <div className="flex items-center rounded-input border border-outline bg-surface px-4 py-1 shadow-inset focus-within:outline-2 focus-within:outline-accent">
            <input id="momentum-signup-password" value={password} onChange={event => { setPassword(event.target.value); setError(null); }} type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="At least 8 characters" className="w-full min-w-0 flex-1 bg-transparent py-3 font-heading text-body text-text outline-none" />
            <button type="button" onClick={() => setShowPassword(value => !value)} className="ml-2 font-heading text-label font-bold text-accent-strong">{showPassword ? "Hide" : "Show"}</button>
          </div>
          <div className="flex items-center gap-1.5" aria-label={`Password strength: ${passwordScore} of 4`}>
            {[0,1,2,3].map(i => <span key={i} className={`h-1.5 flex-1 rounded-full ${i<passwordScore ? "bg-success" : "bg-accent-tint"}`} />)}
            <span className="ml-1 font-heading text-meta text-success">{strong ? "Strong" : password.length ? "Keep going" : ""}</span>
          </div>
        </div>
      </div>
      {error ? <p role="alert" className="font-heading text-meta text-warning">{error}</p> : null}
      <div className="mt-auto flex flex-col gap-4 pt-6">
        <p className="text-center font-heading text-meta text-text-muted">By continuing you agree to the Terms and Privacy Policy.</p>
        <Button onClick={handleContinue}>Create account</Button>
        <p className="text-center font-heading text-meta text-text-muted">Already have an account? <Link href="/onboarding/sign-in" className="font-bold text-accent-strong">Sign in</Link></p>
        <p className="text-center font-heading text-meta text-warning">UI preview only: no account or verification email is created yet.</p>
      </div>
    </div>
  );
}
