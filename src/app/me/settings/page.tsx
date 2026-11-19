"use client";

import { Suspense } from "react";
import { useToday } from "@/frontend/hooks";
import { AppShell } from "@/frontend/home/AppShell";
import { SettingsScreen } from "@/frontend/me/SettingsScreen";

export default function SettingsPage() {
  const today = useToday();
  return (
    <AppShell active="me" onAddTask={today.addTask} onAddHabit={today.addHabit}>
      <Suspense fallback={null}>
        <SettingsScreen />
      </Suspense>
    </AppShell>
  );
}
