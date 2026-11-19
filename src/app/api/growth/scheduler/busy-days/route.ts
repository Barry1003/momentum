import { apiError, requiredUser, result } from "@/modules/squads/http";
import { SquadError } from "@/modules/squads/policy";
import * as studio from "@/modules/growth/service";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    const user = await requiredUser();
    const params = new URL(request.url).searchParams;
    const year = Number(params.get("year"));
    const month = Number(params.get("month"));
    if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 0 || month > 11) throw new SquadError("INVALID_INPUT", 400, "Invalid month");
    return result(await studio.getBusyDays(user.id, year, month));
  } catch (error) { return apiError(error); }
}
