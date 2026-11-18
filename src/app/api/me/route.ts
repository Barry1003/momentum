import { NextResponse } from "next/server";
import { getPrisma } from "@/db/client";
import { getCurrentUser } from "@/modules/auth/session";
import { updateProfileSchema } from "@/modules/users/profile";

export const runtime = "nodejs";

const noStore = { "Cache-Control": "private, no-store" };

async function requireVerifiedUser() {
  const user = await getCurrentUser();
  return user?.emailVerified ? user : null;
}

export async function GET() {
  const user = await requireVerifiedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized or unverified" }, { status: 401, headers: noStore });
  const profile = await getPrisma().userProfile.findUnique({ where: { userId: user.id } });
  return NextResponse.json({
    user: { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified },
    profile: profile ? { displayName: profile.displayName, timezone: profile.timezone, avatarArtStyle: profile.avatarArtStyle } : null,
  }, { headers: noStore });
}

export async function PATCH(request: Request) {
  const user = await requireVerifiedUser();
  if (!user) return NextResponse.json({ error: "Unauthorized or unverified" }, { status: 401, headers: noStore });
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return NextResponse.json({ error: "Expected application/json" }, { status: 415, headers: noStore });
  let body: unknown;
  try {
    const raw = await request.text();
    if (raw.length > 4096) return NextResponse.json({ error: "Request too large" }, { status: 413, headers: noStore });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: noStore });
  }
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile fields" }, { status: 400, headers: noStore });
  const profile = await getPrisma().userProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id, displayName: parsed.data.displayName ?? user.name,
      timezone: parsed.data.timezone ?? "UTC",
      avatarArtStyle: parsed.data.avatarArtStyle ?? "SOFT_3D",
    },
    update: parsed.data,
    select: { displayName: true, timezone: true, avatarArtStyle: true },
  });
  return NextResponse.json({ profile }, { headers: noStore });
}
