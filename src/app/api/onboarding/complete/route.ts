import { apiError, requiredUser, result } from "@/modules/squads/http";
import { finishOnboarding } from "@/modules/onboarding/service";
export const runtime = "nodejs";
export async function POST() {
  try {
    const user = await requiredUser();
    return result(await finishOnboarding(user.id));
  } catch (error) { return apiError(error); }
}
