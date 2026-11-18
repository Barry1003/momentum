import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { onboardingPatchSchema } from "@/modules/onboarding/contract";
import { getOnboardingState, patchOnboarding } from "@/modules/onboarding/service";
export const runtime = "nodejs";
export async function GET() {
  try {
    const user = await requiredUser();
    return result(await getOnboardingState(user.id));
  } catch (error) { return apiError(error); }
}
export async function PATCH(request: Request) {
  try {
    const user = await requiredUser();
    const input = await jsonBody(request, onboardingPatchSchema);
    return result(await patchOnboarding(user.id, input));
  } catch (error) { return apiError(error); }
}
