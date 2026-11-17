import { apiError, requiredUser, result, safeId } from "@/modules/squads/http";
import { closeInvitation, previewInvitation } from "@/modules/squads/service";
export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    return result({ invitation: await previewInvitation(code) });
  } catch (error) { return apiError(error); }
}
export async function DELETE(_: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const user = await requiredUser();
    const { code } = await params;
    // DELETE uses the invitation record ID, unlike public GET which uses a raw code.
    return result(await closeInvitation(safeId(code), user.id));
  } catch (error) { return apiError(error); }
}
