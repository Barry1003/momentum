import { apiError, jsonBody, requiredUser, result, safeId } from "@/modules/squads/http";
import { updateSquadSchema } from "@/modules/squads/validation";
import { getSquad, updateSquad } from "@/modules/squads/service";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };
export async function GET(_: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { id } = await context.params;
    return result({ squad: await getSquad(safeId(id), user.id) });
  } catch (error) { return apiError(error); }
}
export async function PATCH(request: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { id } = await context.params;
    const input = await jsonBody(request, updateSquadSchema);
    return result({ squad: await updateSquad(safeId(id), user.id, input) });
  } catch (error) { return apiError(error); }
}
