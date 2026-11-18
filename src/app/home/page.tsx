"use client";

import { Suspense } from "react";
import { useToday } from "@/frontend/hooks";
import { AppShell } from "@/frontend/home/AppShell";
import { HomeScreen } from "@/frontend/home/HomeScreen";

function HomeRoute() {
  const today = useToday();
  return (
    <AppShell active="home" onAddTask={today.addTask} onAddHabit={today.addHabit}>
      <Suspense fallback={null}>
        <HomeScreen today={today} />
      </Suspense>
    </AppShell>
  );
}

export default function HomePage() {
  return <HomeRoute />;
}
