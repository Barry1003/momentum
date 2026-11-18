import { apiError, requiredUser, result, safeId } from "@/modules/squads/http";
import { habitHistory } from "@/modules/habits/service";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await requiredUser();
    const id = new URL(request.url).searchParams.get("habitId");
    return result({ history: await habitHistory(user.id, id ? safeId(id) : undefined) });
  } catch (error) { return apiError(error); }
}
