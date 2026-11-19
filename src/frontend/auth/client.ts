"use client";
import { createAuthClient } from "@neondatabase/auth/next";

/** Same-origin proxy; Neon Auth manages OAuth and session cookies. */
export const authClient = createAuthClient();
