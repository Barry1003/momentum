"use client";

import { useToday } from "@/frontend/hooks";
import { AppShell } from "@/frontend/home/AppShell";
import { NotificationsScreen } from "@/frontend/home/NotificationsScreen";

export default function NotificationsPage() {
  const today = useToday();
  return (
    <AppShell active="home" onAddTask={today.addTask} onAddHabit={today.addHabit}>
      <NotificationsScreen />
    </AppShell>
  );
}
