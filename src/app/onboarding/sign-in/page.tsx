"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Field, FaceAvatar, Logo } from "@/frontend/components";
import { GoogleMark } from "@/frontend/components/GoogleMark";
import { Companion } from "@/frontend/companion";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState(false);

  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-center md:gap-16">
      <div className="hidden flex-1 flex-col items-center gap-4 md:flex">
        <Logo />
        <Companion stage="adult" reaction="idle" look={{ room: "lavender", outfit: "original" }} size="hero" />
        <div className="flex items-center gap-3 rounded-card bg-surface p-4 shadow-raised">
          <FaceAvatar name="You" size={40} />
          <div>
            <p className="font-heading text-label font-bold text-text">Welcome back</p>
            <p className="font-heading text-meta text-text-muted">Your space kept everything just as you left it.</p>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-[18px]">
        <div className="mb-3"><div className="md:hidden"><Logo /></div>
          <h1 className="mt-8 font-display text-title font-extrabold text-text">Welcome back</h1>
          <p className="mt-1 font-heading text-meta text-text-muted">Sign in to pick up where you left off.</p>
        </div>
        <button type="button" onClick={() => setNotice(true)} className="flex items-center justify-center gap-3 rounded-button bg-surface px-5 py-4 font-heading text-label font-bold text-text shadow-raised">
          <GoogleMark className="size-5" /> Continue with Google
        </button>
        <div className="flex items-center gap-3"><span className="h-px flex-1 bg-outline" /><span className="font-heading text-meta text-text-muted">or with email</span><span className="h-px flex-1 bg-outline" /></div>
        <Field label="Email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="ari@example.com" />
        <Field label="Password" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="••••••••" />
        <Link href="/onboarding/cant-get-in" className="self-end font-heading text-meta font-bold text-accent-strong">Forgot password?</Link>
        <Button variant="primary" onClick={() => setNotice(true)}>Sign in</Button>
        {notice ? <p role="status" className="font-heading text-meta text-warning">Sign-in is not connected in this frontend preview. No authentication has occurred.</p> : null}
        <p className="text-center font-heading text-meta text-text-muted">New here? <Link href="/onboarding/create-account" className="font-bold text-accent-strong">Create an account</Link></p>
      </div>
    </div>
  );
}
