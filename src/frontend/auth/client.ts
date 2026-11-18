"use client";
import { createAuthClient } from "better-auth/react";
import { emailOTPClient } from "better-auth/client/plugins";

// Same-origin auth endpoints; do not ship a server secret to the browser.
export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
});
