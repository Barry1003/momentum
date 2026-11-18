"use client";

import { Suspense } from "react";
import { useToday } from "@/frontend/hooks";
import { AppShell } from "@/frontend/home/AppShell";
import { MeScreen } from "@/frontend/me/MeScreen";

export default function MePage() {
  const today = useToday();
  return (
    <AppShell active="me" onAddTask={today.addTask} onAddHabit={today.addHabit}>
      <Suspense fallback={null}>
        <MeScreen />
      </Suspense>
    </AppShell>
  );
}
