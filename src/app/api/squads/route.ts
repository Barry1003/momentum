import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { createSquadSchema } from "@/modules/squads/validation";
import { createSquad, listMySquads } from "@/modules/squads/service";
export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requiredUser();
    return result({ squads: await listMySquads(user.id) });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    const user = await requiredUser();
    const input = await jsonBody(request, createSquadSchema);
    return result({ squad: await createSquad(user.id, input) }, 201);
  } catch (error) { return apiError(error); }
}
