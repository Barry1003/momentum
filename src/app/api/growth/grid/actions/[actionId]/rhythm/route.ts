import { apiError, jsonBody, requiredUser, result, safeId } from "@/modules/squads/http";
import * as studio from "@/modules/growth/service";
import * as v from "@/modules/growth/validation";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ actionId: string }> };
export async function PATCH(request: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { actionId } = await context.params;
    const { rhythm } = await jsonBody(request, v.rhythmSchema);
    return result(await studio.setActionRhythm(user.id, safeId(actionId), rhythm));
  } catch (error) { return apiError(error); }
}
