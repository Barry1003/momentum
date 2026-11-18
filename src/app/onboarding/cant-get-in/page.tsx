"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Note, ScreenHeader } from "@/frontend/components";

export default function CantGetInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <div className="flex flex-col gap-[18px]">
      <ScreenHeader kicker="Sign in" title="Can&apos;t get in?" onBack={() => router.back()} />

      {sent ? (
        <Note tone="success" title="Code sent">
          If an account exists for that email, a sign-in code is on its way.
        </Note>
      ) : (
        <>
          <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ari@example.com" />
          <Button variant="primary" onClick={() => setSent(true)}>
            Send a sign-in code
          </Button>
        </>
      )}

      <p className="text-center font-heading text-meta text-text-muted">
        I no longer use that email —{" "}
        <a href="mailto:support@momentum.app" className="font-bold text-accent-strong">
          contact support
        </a>
      </p>
    </div>
  );
}
