import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import * as studio from "@/modules/growth/service";
import * as v from "@/modules/growth/validation";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const user = await requiredUser();
    const { blank } = await jsonBody(request, v.suggestedGridSchema);
    return result(await studio.applySuggestedGrid(user.id, blank));
  } catch (error) { return apiError(error); }
}
