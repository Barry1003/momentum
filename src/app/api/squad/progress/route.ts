import { apiError, requiredUser, result } from "@/modules/squads/http";
import { getSquadProgress } from "@/modules/social/service";
export const runtime = "nodejs";

export async function GET() {
  try { const user = await requiredUser(); return result(await getSquadProgress(user.id)); }
  catch (error) { return apiError(error); }
}
