import "server-only";
import { createNeonAuth } from "@neon/auth/next/server";

function requiredEnv(key: "NEON_AUTH_BASE_URL" | "NEON_AUTH_COOKIE_SECRET") {
  const value = process.env[key];
  if (!value) throw new Error(`${key} must be configured for Neon-managed authentication`);
  return value;
}

let instance: ReturnType<typeof createNeonAuth> | undefined;

/**
 * Lazy initialization: Next.js imports route modules while building even when
 * CI has no authentication secrets. Missing settings still fail closed at
 * request time, rather than breaking unrelated build-time route inspection.
 */
export function getManagedAuth() {
  return (instance ??= createNeonAuth({
    baseUrl: requiredEnv("NEON_AUTH_BASE_URL"),
    cookies: { secret: requiredEnv("NEON_AUTH_COOKIE_SECRET") },
  }));
}
