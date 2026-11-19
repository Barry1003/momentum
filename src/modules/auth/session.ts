import "server-only";
import { getPrisma } from "@/db/client";
import { getAuth } from "./config";

export type AuthenticatedUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  image: string | null;
};

/**
 * Mirror only the public identity fields in Momentum's own User row.
 * All existing squad, task, habit and profile foreign keys reference this row.
 * Authentication itself (credentials, sessions, verification) belongs to Neon Auth.
 *
 * This must never link a different legacy account by matching email address.
 * A collision fails closed until an explicit, verified account-migration plan exists.
 */
async function ensureApplicationUser(user: AuthenticatedUser): Promise<void> {
  const prisma = getPrisma();
  const emailOwner = await prisma.user.findUnique({
    where: { email: user.email }, select: { id: true },
  });
  if (emailOwner && emailOwner.id !== user.id) {
    throw new Error("Existing Momentum account requires verified migration");
  }
  await prisma.user.upsert({
    where: { id: user.id },
    create: {
      id: user.id, email: user.email, name: user.name,
      emailVerified: user.emailVerified, image: user.image,
    },
    update: {
      email: user.email, name: user.name,
      emailVerified: user.emailVerified, image: user.image,
    },
  });
}

/** Neon-managed sessions are the only authentication authority. */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const response = await getAuth().getSession();
  if (response.error) {
    // A provider/network outage must not be mistaken for a signed-out user.
    throw new Error("Unable to validate Neon Auth session");
  }
  if (!response.data?.user) return null;
  const account = response.data.user;
  const user: AuthenticatedUser = {
    id: account.id,
    email: account.email,
    emailVerified: account.emailVerified === true,
    name: account.name ?? "Momentum member",
    image: account.image ?? null,
  };
  await ensureApplicationUser(user);
  return user;
}
