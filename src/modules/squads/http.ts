import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { getCurrentUser } from "@/modules/auth/session";
import { SquadError } from "./policy";

const headers = { "Cache-Control": "private, no-store" };
export function apiError(error: unknown): NextResponse {
  if (error instanceof SquadError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status, headers });
  }
  // Authentication and persistence errors must not expose private data.
  return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Unable to complete request" } }, { status: 500, headers });
}

export function result(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, { status, headers });
}

export async function requiredUser(): Promise<{ id: string; email: string }> {
  const user = await getCurrentUser();
  if (!user) throw new SquadError("UNAUTHORIZED", 401, "Sign in required");
  if (!user.emailVerified) throw new SquadError("EMAIL_NOT_VERIFIED", 403, "Verify your email first");
  return { id: user.id, email: user.email };
}

export async function jsonBody<T>(request: Request, schema: ZodType<T>): Promise<T> {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    throw new SquadError("UNSUPPORTED_MEDIA_TYPE", 415, "Expected application/json");
  }
  const contentLength = Number(request.headers.get("content-length") || "0");
  if (contentLength > 16384) throw new SquadError("PAYLOAD_TOO_LARGE", 413, "Request is too large");
  let payload: unknown;
  try {
    const text = await request.text();
    if (text.length > 16384) throw new SquadError("PAYLOAD_TOO_LARGE", 413, "Request is too large");
    payload = JSON.parse(text);
  } catch (e) {
    if (e instanceof SquadError) throw e;
    throw new SquadError("INVALID_JSON", 400, "Invalid JSON body");
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) throw new SquadError("INVALID_INPUT", 400, "Invalid input fields");
  return parsed.data;
}

export function safeId(value: string): string {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(value)) throw new SquadError("NOT_FOUND", 404, "Not found");
  return value;
}
