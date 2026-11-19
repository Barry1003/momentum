import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { cheerMoment } from "@/modules/social/service";
import { momentCheerSchema } from "@/modules/social/validation";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requiredUser();
    const { momentId } = await jsonBody(request, momentCheerSchema);
    return result(await cheerMoment(user.id, momentId), 201);
  } catch (error) { return apiError(error); }
}
