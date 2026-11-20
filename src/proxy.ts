import type { NextRequest } from "next/server";
import { getManagedAuth } from "@/modules/auth/managed";

/**
 * Neon Managed Better Auth OAuth return handshake.
 *
 * Neon redirects with neon_auth_session_verifier plus a challenge cookie.
 * The SDK middleware exchanges them for an HTTP-only session cookie before
 * rendering the callback page. Without this step the splash/onboarding API
 * sees a signed-out user and loops back to login.
 *
 * Match only the two supported OAuth return paths. Application API routes
 * retain their existing 401/403 contract; public onboarding stays public.
 */
export async function proxy(request: NextRequest) {
  const middleware = getManagedAuth().middleware({
    loginUrl: "/onboarding/sign-in",
    publicRoutes: ["/", "/onboarding/auth-complete"],
  });
  return middleware(request);
}

export const config = {
  matcher: ["/", "/onboarding/auth-complete"],
};
