import { apiError, requiredUser, result } from "@/modules/squads/http";
import { getProgress } from "@/modules/progress/service";
export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requiredUser();
    const params = new URL(request.url).searchParams;
    // Bad or missing dates fall back to today; the range is ordered and clamped on the server.
    return result(await getProgress(user.id, params.get("from"), params.get("to")));
  } catch (error) { return apiError(error); }
}
