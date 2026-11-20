"use client";
import { createAuthClient } from "@neon/auth/next";

// Uses /api/auth through the Next.js proxy; no public Google OAuth secrets.
export const authClient = createAuthClient();
