import { apiError, requiredUser, result } from "@/modules/squads/http";
import { getAccount } from "@/modules/account/service";
export const runtime = "nodejs";

export async function GET() {
  try { const user = await requiredUser(); return result(await getAccount(user.id)); }
  catch (error) { return apiError(error); }
}
