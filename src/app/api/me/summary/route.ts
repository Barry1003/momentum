import { apiError, requiredUser, result } from "@/modules/squads/http";
import { getProfileSummary } from "@/modules/companion/service";
export const runtime = "nodejs";

export async function GET() {
  try { const user = await requiredUser(); return result(await getProfileSummary(user.id)); }
  catch (error) { return apiError(error); }
}
