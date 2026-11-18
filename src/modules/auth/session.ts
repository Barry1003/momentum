import "server-only";
import { headers } from "next/headers";
import { getAuth } from "./config";

export type AuthenticatedUser = { id: string; email: string; emailVerified: boolean; name: string };

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    emailVerified: session.user.emailVerified,
    name: session.user.name,
  };
}
