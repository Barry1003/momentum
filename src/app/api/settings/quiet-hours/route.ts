import { apiError, jsonBody, requiredUser, result } from "@/modules/squads/http";
import { getQuietHours, saveQuietHours } from "@/modules/settings/service";
import { quietHoursSchema } from "@/modules/settings/validation";
export const runtime = "nodejs";

export async function GET() {
  try { const user = await requiredUser(); return result(await getQuietHours(user.id)); }
  catch (error) { return apiError(error); }
}
export async function PUT(request: Request) {
  try {
    const user = await requiredUser();
    const input = await jsonBody(request, quietHoursSchema);
    return result(await saveQuietHours(user.id, input));
  } catch (error) { return apiError(error); }
}
