"use client";

import { Suspense } from "react";
import { useToday } from "@/frontend/hooks";
import { AppShell } from "@/frontend/home/AppShell";
import { StudioScreen } from "@/frontend/me/StudioScreen";

export default function StudioPage() {
  const today = useToday();
  return (
    <AppShell active="me" onAddTask={today.addTask} onAddHabit={today.addHabit}>
      <Suspense fallback={null}>
        <StudioScreen />
      </Suspense>
    </AppShell>
  );
}
