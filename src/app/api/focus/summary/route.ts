import { apiError, requiredUser, result } from "@/modules/squads/http";
import { focusSummary } from "@/modules/focus/service";
export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await requiredUser();
    return result(await focusSummary(user.id));
  } catch (error) { return apiError(error); }
}
