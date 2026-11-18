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
  | "/home?tab=squad";

export function resolveLaunchDestination(identity: LaunchIdentity): LaunchDestination {
  if (identity.status === "checking") return null;
  if (identity.status === "signed-out") {
    return identity.hasVisitedBefore ? "/onboarding/sign-in" : "/onboarding";
  }
  if (!identity.onboardingComplete) return "/onboarding/name";
  // Everyone lands on Home (My Space). Squad members open on the Squad Room tab.
  return identity.hasSquad ? "/home?tab=squad" : "/home";
}
