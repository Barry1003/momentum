import "server-only";
import { getAuth } from "./config";

export type AuthenticatedUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  image: string | null;
};

/** The managed Neon session is the source of truth for every API request. */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const { data, error } = await getAuth().getSession();
  if (error || !data?.user) return null;
  const user = data.user;
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified === true,
    name: user.name ?? "Momentum member",
    image: user.image ?? null,
  };
}
