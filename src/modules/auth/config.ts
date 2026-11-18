import "server-only";
import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Managed Neon Auth is the only authentication authority.
 * Never accept identity from request payloads, headers supplied by the caller,
 * or the old local Better Auth session tables.
 */
export function getAuth() {
  const baseUrl = process.env.NEON_AUTH_BASE_URL;
  const secret = process.env.NEON_AUTH_COOKIE_SECRET;
  if (!baseUrl || !secret || secret.length < 32) {
    throw new Error("NEON_AUTH_BASE_URL and a 32+ character NEON_AUTH_COOKIE_SECRET are required");
  }
  return createNeonAuth({
    baseUrl,
    cookies: { secret },
  });
}
