import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { getProfileDetails, saveProfileDetails } from "@/modules/settings/service";
import { profileDetailsSchema } from "@/modules/settings/validation";
export const runtime = "nodejs";

export async function GET() {
  try { const user = await requiredUser(); return result(await getProfileDetails(user.id)); }
  catch (error) { return apiError(error); }
}
export async function PUT(request: Request) {
  try {
    const user = await requiredUser();
    const input = await jsonBody(request, profileDetailsSchema);
    return result(await saveProfileDetails(user.id, input));
  } catch (error) { return apiError(error); }
}
