import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { getStudio, saveLook } from "@/modules/companion/service";
import { lookSchema } from "@/modules/companion/validation";
export const runtime = "nodejs";

export async function GET() {
  try { const user = await requiredUser(); return result(await getStudio(user.id)); }
  catch (error) { return apiError(error); }
}
export async function PUT(request: Request) {
  try {
    const user = await requiredUser();
    const changes = await jsonBody(request, lookSchema);
    return result(await saveLook(user.id, changes));
  } catch (error) { return apiError(error); }
}
