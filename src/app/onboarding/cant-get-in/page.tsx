"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/frontend/auth/client";
import { emailSchema } from "@/frontend/onboarding/schemas";
import { Button, Field, Note, ScreenHeader } from "@/frontend/components";
import { StepShell } from "@/frontend/onboarding/StepShell";

export default function CantGetInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <StepShell>
    <div className="flex flex-col gap-[18px]">
      <ScreenHeader kicker="Sign in" title="Can&apos;t get in?" onBack={() => router.back()} />

      {sent ? (
        <Note tone="success" title="Email requested">
          If an account exists for that email, a password reset link is on its way.
        </Note>
      ) : (
        <>
          <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ari@example.com" />
          <Button variant="primary" disabled={busy} onClick={async () => {
            const valid = emailSchema.safeParse(email);
            if (!valid.success) { setError("Enter a valid email."); return; }
            setBusy(true); setError(null);
            try {
              await authClient.requestPasswordReset({ email: valid.data, redirectTo: `${window.location.origin}/onboarding/reset-password` });
              setSent(true);
            } catch { setError("Could not request password recovery. Try again."); }
            finally { setBusy(false); }
          }}>
            Email me a reset link
          </Button>
          {error ? <p role="alert" className="font-heading text-meta text-warning">{error}</p> : null}
        </>
      )}

      <p className="text-center font-heading text-meta text-text-muted">
        I no longer use that email —{" "}
        <a href="mailto:support@momentum.app" className="font-bold text-accent-strong">
          contact support
        </a>
      </p>
    </div>
    </StepShell>
  );
}
