"use client";

import { Suspense } from "react";
import { useToday } from "@/frontend/hooks";
import { AppShell } from "@/frontend/home/AppShell";
import { PlannerScreen } from "@/frontend/planner/PlannerScreen";

export default function PlannerPage() {
  const today = useToday();
  return (
    <AppShell active="plan" onAddTask={today.addTask} onAddHabit={today.addHabit}>
      <Suspense fallback={null}>
        <PlannerScreen today={today} />
      </Suspense>
    </AppShell>
  );
}
