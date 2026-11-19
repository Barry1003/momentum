import { apiError, jsonBody, requiredUser, result, safeId } from "@/modules/squads/http";
import * as studio from "@/modules/growth/service";
import * as v from "@/modules/growth/validation";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ taskId: string }> };
export async function POST(request: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { taskId } = await context.params;
    const input = await jsonBody(request, v.scheduleSchema);
    return result(await studio.scheduleTask(user.id, safeId(taskId), input));
  } catch (error) { return apiError(error); }
}
