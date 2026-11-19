import { apiError, jsonBody, requiredUser, result, safeId } from "@/modules/squads/http";
import * as studio from "@/modules/growth/service";
import * as v from "@/modules/growth/validation";
export const runtime = "nodejs";
type Ctx = { params: Promise<{ questionId: string }> };
export async function PUT(request: Request, context: Ctx) {
  try {
    const user = await requiredUser();
    const { questionId } = await context.params;
    const { answer } = await jsonBody(request, v.answerSchema);
    return result(await studio.answerQuestion(user.id, safeId(questionId), answer));
  } catch (error) { return apiError(error); }
}
