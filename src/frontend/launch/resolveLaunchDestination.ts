/**
 * Pure launch routing decisions.
 *
 * Authentication and onboarding completion must come from trusted application
 * state; never infer a logged-in session from localStorage.
 */
export type LaunchIdentity =
  | { status: "checking" }
  | { status: "signed-out"; hasVisitedBefore: boolean }
  | { status: "signed-in"; onboardingComplete: boolean; hasSquad: boolean };

export type LaunchDestination =
  | null
  | "/onboarding"
  | "/onboarding/sign-in"
  | "/onboarding/name"
  | "/home"
  | "/my-space";

export function resolveLaunchDestination(identity: LaunchIdentity): LaunchDestination {
  if (identity.status === "checking") return null;
  if (identity.status === "signed-out") {
    return identity.hasVisitedBefore ? "/onboarding/sign-in" : "/onboarding";
  }
  if (!identity.onboardingComplete) return "/onboarding/name";
  return identity.hasSquad ? "/home" : "/my-space";
}
