import { requireCompletedOnboarding } from "@/modules/onboarding/guard";
export const dynamic = "force-dynamic";
export default async function PlannerLayout({ children }: { children: React.ReactNode }) {
  await requireCompletedOnboarding();
  return children;
}
