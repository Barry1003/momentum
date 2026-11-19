import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { setMuted } from "@/modules/social/service";
import { muteSchema } from "@/modules/social/validation";
export const runtime = "nodejs";

export async function PUT(request: Request) {
  try {
    const user = await requiredUser();
    const { mutedUserId, muted } = await jsonBody(request, muteSchema);
    return result(await setMuted(user.id, mutedUserId, muted));
  } catch (error) { return apiError(error); }
}
