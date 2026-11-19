"use client";

import { Suspense } from "react";
import { useToday } from "@/frontend/hooks";
import { AppShell } from "@/frontend/home/AppShell";
import { ProgressScreen } from "@/frontend/progress/ProgressScreen";

export default function ProgressPage() {
  const today = useToday();
  return (
    <AppShell active="progress" onAddTask={today.addTask} onAddHabit={today.addHabit}>
      <Suspense fallback={null}>
        <ProgressScreen />
      </Suspense>
    </AppShell>
  );
}
