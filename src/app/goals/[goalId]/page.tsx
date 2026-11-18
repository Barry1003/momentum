"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { useToday } from "@/frontend/hooks";
import { AppShell } from "@/frontend/home/AppShell";
import { GoalScreen } from "@/frontend/goals/GoalScreen";

export default function GoalPage() {
  const params = useParams<{ goalId: string }>();
  const today = useToday();
  const goalId = typeof params.goalId === "string" ? decodeURIComponent(params.goalId) : "";
  return (
    <AppShell active="plan" onAddTask={today.addTask} onAddHabit={today.addHabit}>
      <Suspense fallback={null}>
        <GoalScreen key={goalId} goalId={goalId} />
      </Suspense>
    </AppShell>
  );
}
