import { apiError, requiredUser, result, safeId } from "@/modules/squads/http";
import { listMembers } from "@/modules/squads/service";
export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requiredUser();
    const { id } = await params;
    return result({ members: await listMembers(safeId(id), user.id) });
  } catch (error) { return apiError(error); }
}
