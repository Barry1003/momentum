import { apiError, requiredUser, result, safeId } from "@/modules/squads/http";
import { getGoalSnapshot } from "@/modules/progress/service";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(_: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { id } = await context.params;
    return result(await getGoalSnapshot(user.id, safeId(id)));
  } catch (error) { return apiError(error); }
}
