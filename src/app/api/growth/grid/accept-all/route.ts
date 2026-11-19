import { apiError, requiredUser, result } from "@/modules/squads/http";
import * as studio from "@/modules/growth/service";
export const runtime = "nodejs";
export async function POST() {
  try { const user = await requiredUser(); return result(await studio.acceptAllRhythms(user.id)); }
  catch (error) { return apiError(error); }
}
