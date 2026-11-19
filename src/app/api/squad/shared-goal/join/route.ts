import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { joinSharedGoal } from "@/modules/social/service";
import { sharedGoalPrefsSchema } from "@/modules/social/validation";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requiredUser();
    const prefs = await jsonBody(request, sharedGoalPrefsSchema);
    return result({ goal: await joinSharedGoal(user.id, prefs) });
  } catch (error) { return apiError(error); }
}
