"use client";

import { useToday } from "@/frontend/hooks";
import { AppShell } from "@/frontend/home/AppShell";
import { CheckInScreen } from "@/frontend/progress/CheckInScreen";

export default function CheckInPage() {
  const today = useToday();
  return (
    <AppShell active="progress" onAddTask={today.addTask} onAddHabit={today.addHabit}>
      <CheckInScreen />
    </AppShell>
  );
}
