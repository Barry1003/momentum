/** Pure decisions for the post-authentication handoff. No localStorage auth guesses. */
const ONBOARDING_PATHS = new Set([
  "/onboarding/name",
  "/onboarding/companion",
  "/onboarding/privacy",
  "/onboarding/join",
  "/onboarding/ready",
]);

export type AuthCompletion =
  | { state: "retry"; message: string }
  | { state: "sign-in"; message: string }
  | { state: "verify-email" }
  | { state: "navigate"; destination: string };

export function resolveAuthCompletion(args: {
  session: "authenticated" | "missing" | "error";
  emailVerified?: boolean;
  onboardingStatus?: number;
  complete?: boolean;
  hasSquad?: boolean;
  destination?: string;
}): AuthCompletion {
  if (args.session === "error") return { state: "retry", message: "We could not confirm your session. Please retry." };
  if (args.session === "missing") return { state: "sign-in", message: "Your Google sign-in returned without an active session. Please try signing in again." };
  if (args.emailVerified === false) return { state: "verify-email" };
  if (args.onboardingStatus === 401) return { state: "retry", message: "Your session was not recognized by the app. Please retry or sign in again." };
  if (args.onboardingStatus === 403) return { state: "retry", message: "Your account is signed in but onboarding access is restricted. Check email verification." };
  if (args.onboardingStatus !== 200) return { state: "retry", message: "We could not load your onboarding progress. Please retry." };
  if (args.complete) return { state: "navigate", destination: args.hasSquad ? "/home?tab=squad" : "/home" };
  return {
    state: "navigate",
    destination: args.destination && ONBOARDING_PATHS.has(args.destination)
      ? args.destination
      : "/onboarding/name",
  };
}
