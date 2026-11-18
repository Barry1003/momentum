import { apiError, requiredUser, result, safeId } from "@/modules/squads/http";
import { leaveSquad } from "@/modules/squads/service";
export const runtime = "nodejs";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requiredUser();
    const { id } = await params;
    return result(await leaveSquad(safeId(id), user.id));
  } catch (error) { return apiError(error); }
}
