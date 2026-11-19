import { apiError, requiredUser, result, safeId } from "@/modules/squads/http";
import { getMemberShare } from "@/modules/social/service";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ userId: string }> };

export async function GET(_: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { userId } = await context.params;
    return result(await getMemberShare(user.id, safeId(userId)));
  } catch (error) { return apiError(error); }
}
