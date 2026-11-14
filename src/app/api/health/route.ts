import { NextResponse } from "next/server";
import { getHealthResponse } from "@/modules/system/health";

export function GET() {
  return NextResponse.json(getHealthResponse(), {
    headers: { "Cache-Control": "no-store" },
  });
}
