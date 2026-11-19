import { apiError, requiredUser, result } from "@/modules/squads/http";
import { getCompanionOverview } from "@/modules/companion/service";
export const runtime = "nodejs";

export async function GET() {
  try { const user = await requiredUser(); return result(await getCompanionOverview(user.id)); }
  catch (error) { return apiError(error); }
}
