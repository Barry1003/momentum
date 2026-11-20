import "server-only";
import { getPrisma } from "@/db/client";
import { auth } from "./managed";

export type AuthenticatedUser = { id: string; email: string; emailVerified: boolean; name: string };

/**
 * Trust the managed Neon session, never a client-supplied ID or email.
 * Application tables still reference public.user. Reuse the managed user ID
 * and refuse ambiguous existing email matches instead of claiming old data.
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const { data: session, error } = await auth.getSession();
  if (error) throw new Error("Unable to validate Neon Auth session");
  if (!session?.user) return null;
  const remote = session.user;
  if (!remote.emailVerified) {
    return { id: remote.id, email: remote.email, name: remote.name ?? "", emailVerified: false };
  }

  const db = getPrisma();
  const existing = await db.user.findUnique({ where: { id: remote.id } });
  if (existing && existing.email !== remote.email) {
    // Account data and identity must be reconciled through a trusted process.
    throw new Error("Neon identity and application account email disagree");
  }
  if (!existing) {
    const emailOwner = await db.user.findUnique({ where: { email: remote.email } });
    if (emailOwner && emailOwner.id !== remote.id) {
      throw new Error("Existing account requires a reviewed identity migration");
    }
    // Simultaneous requests are safe: create the record only once.
    await db.user.upsert({
      where: { id: remote.id },
      create: {
        id: remote.id,
        email: remote.email,
        name: remote.name ?? remote.email.split("@")[0],
        emailVerified: true,
      },
      update: {},
    });
  } else if (!existing.emailVerified) {
    await db.user.update({ where: { id: remote.id }, data: { emailVerified: true } });
  }

  return { id: remote.id, email: remote.email, emailVerified: true, name: remote.name ?? "" };
}
