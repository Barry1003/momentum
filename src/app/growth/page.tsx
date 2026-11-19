"use client";

import { Suspense } from "react";
import { useToday } from "@/frontend/hooks";
import { AppShell } from "@/frontend/home/AppShell";
import { GrowthStudioScreen } from "@/frontend/growth/GrowthStudioScreen";

export default function GrowthStudioPage() {
  const today = useToday();
  return (
    <AppShell active="plan" onAddTask={today.addTask} onAddHabit={today.addHabit}>
      <Suspense fallback={null}>
        <GrowthStudioScreen />
      </Suspense>
    </AppShell>
  );
}
