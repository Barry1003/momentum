import { apiError, requiredUser, result, safeId } from "@/modules/squads/http";
import { SquadError } from "@/modules/squads/policy";
import * as studio from "@/modules/growth/service";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await requiredUser();
    const params = new URL(request.url).searchParams;
    const date = params.get("date") ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new SquadError("INVALID_INPUT", 400, "Invalid date");
    const taskId = params.get("taskId");
    return result(await studio.getBusy(user.id, date, taskId ? safeId(taskId) : null));
  } catch (error) { return apiError(error); }
}
