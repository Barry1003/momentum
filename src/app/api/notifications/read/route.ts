import { apiError, requiredUser, result } from "@/modules/squads/http";
import { markAllNotificationsRead } from "@/modules/notifications/service";
export const runtime = "nodejs";

export async function POST() {
  try { const user = await requiredUser(); return result({ notifications: await markAllNotificationsRead(user.id) }); }
  catch (error) { return apiError(error); }
}
