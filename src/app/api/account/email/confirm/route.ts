import { NextResponse } from "next/server";
import { requiredUser } from "@/modules/squads/http";
export const runtime = "nodejs";

/**
 * Legacy local-email mutation must not diverge from Neon-managed identity.
 * Re-enable only with a verified Neon Auth email-change flow and data sync.
 */
export async function POST() {
  await requiredUser();
  return NextResponse.json(
    { error: { code: "MANAGED_AUTH_REQUIRED", message: "Email changes are temporarily unavailable during the authentication migration." } },
    { status: 409, headers: { "Cache-Control": "private, no-store" } },
  );
}
