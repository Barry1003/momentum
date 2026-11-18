import { requireCompletedOnboarding } from "@/modules/onboarding/guard";
export const dynamic = "force-dynamic";
export default async function MySpaceLayout({ children }: { children: React.ReactNode }) {
  await requireCompletedOnboarding();
  return children;
}
