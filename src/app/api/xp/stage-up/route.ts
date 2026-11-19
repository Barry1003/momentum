import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { getPendingStageUp, acknowledgeStageUp } from "@/modules/xp/service";
import { eventIdSchema } from "@/modules/xp/validation";
export const runtime = "nodejs";
export async function GET() {
  try { const user = await requiredUser(); return result(await getPendingStageUp(user.id)); }
  catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    const user = await requiredUser();
    const { eventId } = await jsonBody(request, eventIdSchema);
    return result(await acknowledgeStageUp(user.id, eventId));
  } catch (error) { return apiError(error); }
}
