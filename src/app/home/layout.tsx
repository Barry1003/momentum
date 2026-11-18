import { requireCompletedOnboarding } from "@/modules/onboarding/guard";
export const dynamic = "force-dynamic";
export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  await requireCompletedOnboarding();
  return children;
}
