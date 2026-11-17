import { apiError, requiredUser, result } from "@/modules/squads/http";
import { acceptInvitation } from "@/modules/squads/service";
export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const user = await requiredUser();
    const { code } = await params;
    return result(await acceptInvitation(code, user.id, user.email));
  } catch (error) { return apiError(error); }
}
