import { apiError, jsonBody, requiredUser, result, safeId } from "@/modules/squads/http";
import * as studio from "@/modules/growth/service";
import * as v from "@/modules/growth/validation";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ areaId: string }> };
export async function PUT(request: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { areaId } = await context.params;
    const { rating, note } = await jsonBody(request, v.rateSchema);
    return result(await studio.rateArea(user.id, safeId(areaId), rating, note));
  } catch (error) { return apiError(error); }
}
