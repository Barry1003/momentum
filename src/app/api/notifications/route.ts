import { apiError, requiredUser, result } from "@/modules/squads/http";
import { getNotifications } from "@/modules/notifications/service";
export const runtime = "nodejs";

export async function GET() {
  try { const user = await requiredUser(); return result({ notifications: await getNotifications(user.id) }); }
  catch (error) { return apiError(error); }
}
