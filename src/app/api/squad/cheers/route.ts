import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { sendCheer } from "@/modules/social/service";
import { cheerSchema } from "@/modules/social/validation";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requiredUser();
    const { toUserId, message } = await jsonBody(request, cheerSchema);
    return result(await sendCheer(user.id, toUserId, message), 201);
  } catch (error) { return apiError(error); }
}
