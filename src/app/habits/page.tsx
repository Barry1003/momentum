"use client";

import { Suspense } from "react";
import { useToday } from "@/frontend/hooks";
import { AppShell } from "@/frontend/home/AppShell";
import { HabitsScreen } from "@/frontend/habits/HabitsScreen";

export default function HabitsPage() {
  const today = useToday();
  return (
    <AppShell active="plan" onAddTask={today.addTask} onAddHabit={today.addHabit}>
      <Suspense fallback={null}>
        <HabitsScreen />
      </Suspense>
    </AppShell>
  );
}
