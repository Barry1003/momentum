import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import * as studio from "@/modules/growth/service";
import * as v from "@/modules/growth/validation";
export const runtime = "nodejs";
export async function PUT(request: Request) {
  try {
    const user = await requiredUser();
    const { areas } = await jsonBody(request, v.auditAreasSchema);
    return result(await studio.saveAuditAreas(user.id, areas));
  } catch (error) { return apiError(error); }
}
