import { apiError, jsonBody, requiredUser, result, safeId } from "@/modules/squads/http";
import * as studio from "@/modules/growth/service";
import * as v from "@/modules/growth/validation";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ taskId: string }> };
export async function PATCH(request: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { taskId } = await context.params;
    const { quadrant } = await jsonBody(request, v.quadrantSchema);
    return result(await studio.setQuadrant(user.id, safeId(taskId), quadrant));
  } catch (error) { return apiError(error); }
}
