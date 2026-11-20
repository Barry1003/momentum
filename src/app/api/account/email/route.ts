import { NextResponse } from "next/server";
import { apiError, requiredUser } from "@/modules/squads/http";
export const runtime = "nodejs";

/** Neon-managed identity must be changed before any application email mutation. */
export async function POST() {
  try {
    await requiredUser();
    return NextResponse.json(
      { error: { code: "MANAGED_AUTH_REQUIRED", message: "Email changes are temporarily unavailable during the Neon Auth migration." } },
      { status: 409, headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) { return apiError(error); }
}
