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
  /** Planned length, shown as "25 min". */
  durationMinutes?: number;
  /** Area or goal label, e.g. "Development". */
  category?: string;
}

export interface Habit {
  id: string;
  name: string;
  targetCount: number;
  completedCount: number;
  isScheduledToday: boolean;
  /** Picks the habit orb icon. */
  icon?: "water" | "move" | "read" | "sparkle";
  /** Unit for counted habits, e.g. "glasses". */
  unit?: string;
}

export interface SquadMember {
  id: string;
  name: string;
  avatarInitial: string;
  isCheckedInToday: boolean;
  isFocusing: boolean;
  stage: GrowthStage;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  when: string;
  group: "today" | "earlier";
  kind: "cheer" | "growth" | "squad" | "review";
  fromName?: string;
  isRead: boolean;
}

export interface NewTaskInput {
  title: string;
  durationMinutes?: number;
  category?: string;
}

export interface NewHabitInput {
  name: string;
  targetCount: number;
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
