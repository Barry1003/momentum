import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { confirmEmailChange } from "@/modules/account/service";
import { confirmCodeSchema } from "@/modules/account/validation";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requiredUser();
    const { code } = await jsonBody(request, confirmCodeSchema);
    return result(await confirmEmailChange(user.id, code));
  } catch (error) { return apiError(error); }
}
