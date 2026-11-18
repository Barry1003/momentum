"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/frontend/components";
import { AuthScene } from "@/frontend/onboarding/AuthScene";
import { ClayPasswordField } from "@/frontend/onboarding/ClayField";
import { authClient } from "@/frontend/auth/client";

function PasswordResetForm() {
  const params = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) { setError("Your reset link is missing or expired. Request another."); return; }
    if (password.length < 8 || password !== repeat) {
      setError("Passwords must match and contain at least 8 characters."); return;
    }
    setBusy(true); setError(null);
    try {
      const response = await authClient.resetPassword({ newPassword: password, token });
      if (response.error) { setError(response.error.message || "Unable to reset password."); return; }
      setComplete(true); setPassword(""); setRepeat("");
    } catch { setError("Could not reset password. Please try again."); }
    finally { setBusy(false); }
  }

  return <AuthScene title="Set a new password" subtitle="You're back in control" greeting="Welcome back!">
    {complete ? <>
      <p role="status" className="font-heading text-body">Password updated. Sign in to continue.</p>
      <Link href="/onboarding/sign-in" className="font-heading font-bold text-accent-strong">Go to sign in</Link>
    </> : <form onSubmit={(event) => void submit(event)} className="flex flex-col gap-4">
      <ClayPasswordField label="New password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} />
      <ClayPasswordField label="Confirm password" autoComplete="new-password" value={repeat} onChange={event => setRepeat(event.target.value)} />
      {error ? <p role="alert" className="font-heading text-meta text-warning">{error}</p> : null}
      <Button type="submit" disabled={busy || !token}>Reset password</Button>
    </form>}
  </AuthScene>;
}
export default function PasswordResetPage() {
  return <Suspense fallback={null}><PasswordResetForm /></Suspense>;
}
