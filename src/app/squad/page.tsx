"use client";

import { Suspense } from "react";
import { useToday } from "@/frontend/hooks";
import { AppShell } from "@/frontend/home/AppShell";
import { SquadScreen } from "@/frontend/squad/SquadScreen";

export default function SquadPage() {
  const today = useToday();
  return (
    <AppShell active="home" onAddTask={today.addTask} onAddHabit={today.addHabit}>
      <Suspense fallback={null}>
        <SquadScreen />
      </Suspense>
    </AppShell>
  );
}
