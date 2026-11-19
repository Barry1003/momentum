import { NextResponse } from "next/server";
import { apiError, requiredUser } from "@/modules/squads/http";
import { exportData } from "@/modules/account/service";
export const runtime = "nodejs";

/** Downloads a JSON copy of the signed-in person's own data. */
export async function GET() {
  try {
    const user = await requiredUser();
    const data = await exportData(user.id);
    const day = new Date().toISOString().slice(0, 10);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="momentum-${day}.json"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) { return apiError(error); }
}
