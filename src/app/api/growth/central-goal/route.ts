import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import * as studio from "@/modules/growth/service";
import * as v from "@/modules/growth/validation";
export const runtime = "nodejs";
export async function PUT(request: Request) {
  try {
    const user = await requiredUser();
    const input = await jsonBody(request, v.centralGoalSchema);
    return result(await studio.setCentralGoal(user.id, input));
  } catch (error) { return apiError(error); }
}
