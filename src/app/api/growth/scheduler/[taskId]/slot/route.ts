import { apiError, requiredUser, result, safeId } from "@/modules/squads/http";
import { SquadError } from "@/modules/squads/policy";
import * as studio from "@/modules/growth/service";
import * as v from "@/modules/growth/validation";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ taskId: string }> };
export async function GET(request: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { taskId } = await context.params;
    const parsed = v.slotQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) throw new SquadError("INVALID_INPUT", 400, "Invalid date or time");
    return result(await studio.checkSlot(user.id, safeId(taskId), parsed.data.date, parsed.data.time));
  } catch (error) { return apiError(error); }
}
