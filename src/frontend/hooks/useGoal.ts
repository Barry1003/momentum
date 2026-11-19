"use client";

import { useCallback, useEffect, useState } from "react";
import { addGoalTask, completeGoalTask, confirmMilestone, getGoal, toggleCriterion } from "../mocks/repository";
import type { GoalDetail, TaskPriority, TaskWhen } from "../mocks/types";

export interface MilestoneResult {
  title: string;
  xpAwarded: number;
  goalReachedXp: number | null;
}

export interface UseGoalResult {
  goal: GoalDetail | null;
  isLoading: boolean;
  notFound: boolean;
  completeTask: (goalTaskId: string) => Promise<number>;
  addTask: (input: { title: string; when: TaskWhen; priority: TaskPriority }) => Promise<void>;
  toggleCriterion: (milestoneId: string, criterionId: string) => Promise<void>;
  confirmMilestone: (milestoneId: string) => Promise<MilestoneResult | null>;
}

export function useGoal(goalId: string): UseGoalResult {
  const [goal, setGoal] = useState<GoalDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    void getGoal(goalId).then((result) => {
      if (!alive) return;
      setGoal(result);
      setNotFound(result === null);
      setIsLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [goalId]);

  const completeTask = useCallback(
    async (goalTaskId: string) => {
      const result = await completeGoalTask(goalId, goalTaskId);
      setGoal(result.goal);
      return result.xpAwarded;
    },
    [goalId],
  );

  const addTask = useCallback(
    async (input: { title: string; when: TaskWhen; priority: TaskPriority }) => {
      setGoal(await addGoalTask(goalId, input));
    },
    [goalId],
  );

  const handleToggle = useCallback(
    async (milestoneId: string, criterionId: string) => {
      setGoal(await toggleCriterion(goalId, milestoneId, criterionId));
    },
    [goalId],
  );

  const handleConfirm = useCallback(
    async (milestoneId: string) => {
      const result = await confirmMilestone(goalId, milestoneId);
      setGoal(result.goal);
      if (!result.xpAwarded) return null;
      const milestone = result.goal.milestones.find((item) => item.id === milestoneId);
      return { title: milestone?.title ?? "Milestone", xpAwarded: result.xpAwarded, goalReachedXp: result.goalReachedXp };
    },
    [goalId],
  );

  return { goal, isLoading, notFound, completeTask, addTask, toggleCriterion: handleToggle, confirmMilestone: handleConfirm };
}
