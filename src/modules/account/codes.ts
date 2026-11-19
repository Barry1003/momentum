import { createHash, randomInt, timingSafeEqual } from "node:crypto";

export const CODE_TTL_MS = 10 * 60 * 1000;
export const MAX_ATTEMPTS = 5;
export const MAX_REQUESTS_PER_HOUR = 5;
export const DELETION_DELAY_DAYS = 14;

export function newCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Codes are stored as a hash tied to the person and the request, never in plain text. */
export function hashCode(code: string, userId: string, requestId: string): string {
  return createHash("sha256").update(`${requestId}:${userId}:${code}`).digest("hex");
}

export function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}
