import { apiError, jsonBody, requiredUser, result, safeId } from "@/modules/squads/http";
import * as studio from "@/modules/growth/service";
import * as v from "@/modules/growth/validation";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ actionId: string }> };
export async function POST(request: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { actionId } = await context.params;
    const { as, habit } = await jsonBody(request, v.acceptSchema);
    return result(await studio.acceptGridAction(user.id, safeId(actionId), as, habit));
  } catch (error) { return apiError(error); }
}
