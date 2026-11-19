import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { requestEmailChange } from "@/modules/account/service";
import { emailChangeSchema } from "@/modules/account/validation";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await requiredUser();
    const { newEmail } = await jsonBody(request, emailChangeSchema);
    return result(await requestEmailChange(user.id, newEmail));
  } catch (error) { return apiError(error); }
}
