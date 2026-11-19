import { apiError, jsonBody, requiredUser, result, safeId } from "@/modules/squads/http";
import * as studio from "@/modules/growth/service";
import * as v from "@/modules/growth/validation";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ areaId: string }> };
export async function PATCH(request: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { areaId } = await context.params;
    const { name } = await jsonBody(request, v.renameAreaSchema);
    return result(await studio.renameGridArea(user.id, safeId(areaId), name));
  } catch (error) { return apiError(error); }
}
