import type { GrowthStage } from "../companion/types";

export type { GrowthStage };

export interface CompanionState {
  stage: GrowthStage;
  xp: number;
  xpToNextStage: number | null;
}

export interface Task {
  id: string;
  title: string;
  isDone: boolean;
  time?: string;
  goalId?: string;
  isShared: boolean;
  sharedByName?: string;
}

export interface Habit {
  id: string;
  name: string;
  targetCount: number;
  completedCount: number;
  isScheduledToday: boolean;
}

export interface SquadMember {
  id: string;
  name: string;
  avatarInitial: string;
  isCheckedInToday: boolean;
  isFocusing: boolean;
  stage: GrowthStage;
}

export interface TodayData {
  date: string;
  companion: CompanionState;
  tasks: Task[];
  habits: Habit[];
  isCheckInPromptVisible: boolean;
}

export interface HabitsData {
  habits: Habit[];
}

export interface SquadData {
  hasSquad: boolean;
  members: SquadMember[];
}
