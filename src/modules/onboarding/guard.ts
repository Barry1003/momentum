import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/modules/auth/session";
import { getOnboardingState } from "./service";

export async function requireCompletedOnboarding() {
  const user = await getCurrentUser();
  if (!user || !user.emailVerified) redirect("/onboarding/sign-in");
  const status = await getOnboardingState(user.id);
  if (!status.complete) redirect(status.destination);
  return { user, status };
}
