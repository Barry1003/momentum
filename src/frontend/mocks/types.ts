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
  /** Short name of the goal this task feeds, e.g. "Confident developer". */
  goalName?: string;
  priority?: TaskPriority;
}

export type TaskPriority = "high" | "medium" | "low";
export type TaskWhen = "today" | "tomorrow" | "pickDate" | "noDate";
export type TaskRepeat = "never" | "daily" | "weekly" | "monthly";

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
  /** How it is logged: a single tick, a count toward a target, or minutes. */
  kind?: HabitKind;
  /** Short line under the name, e.g. "20 min walk or stretch". */
  detail?: string;
  /** Weekdays it is scheduled on, Monday = 0. */
  scheduleDays?: number[];
  startsOn?: string;
  pausedFrom?: string | null;
  pausedUntil?: string | null;
  reminderTime?: string | null;
  goalName?: string | null;
  shareWithSquad?: boolean;
  archived?: boolean;
}

export type HabitKind = "tick" | "target" | "timer";

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
  when?: TaskWhen;
  priority?: TaskPriority;
  goalName?: string;
  repeats?: TaskRepeat;
  /** Sharing is always a choice: tasks are private unless this is true. */
  shareWithSquad?: boolean;
}

/** A task on another day of the week view. */
export interface PlannerDayTask {
  id: string;
  title: string;
  detail: string;
  isDone: boolean;
  isShared: boolean;
}

export interface PlannerListTask {
  id: string;
  title: string;
  detail: string;
  group: "overdue" | "thisWeek" | "later";
  isDone: boolean;
  isShared: boolean;
  hasDate: boolean;
  badge?: "Move" | "Shared" | "P1";
}

export interface PlannerGoal {
  id: string;
  title: string;
  doneCount: number;
  totalCount: number;
  detail: string;
  isShared: boolean;
  isPaused: boolean;
}

export interface SharedAssignment {
  id: string;
  title: string;
  assignedBy: string;
  due: string;
}

export interface PlannerData {
  /** Unfinished from yesterday, offered back without pressure. */
  carryOver: { id: string; title: string } | null;
  suggestedActionCount: number;
  habitsPerDay: number;
  /** Tasks per weekday, Monday first, for the dots under the week strip. */
  weekTaskCounts: number[];
  /** Other days' tasks, keyed by weekday (0 = Monday). Today's come from TodayData. */
  weekTasks: Record<number, PlannerDayTask[]>;
  allTasks: PlannerListTask[];
  goals: PlannerGoal[];
  shared: SharedAssignment[];
  squadName: string;
}

export interface NewHabitInput {
  name: string;
  targetCount: number;
  kind?: HabitKind;
  unit?: string;
  scheduleDays?: number[];
  reminderTime?: string | null;
  goalName?: string | null;
  shareWithSquad?: boolean;
  /** Habits made on the Habits screen start tomorrow; Quick create starts today. */
  startsTomorrow?: boolean;
}

export interface HabitTracker {
  todayIso: string;
  habits: Habit[];
  /** Count logged per habit per day: history[habitId][iso]. */
  history: Record<string, Record<string, number>>;
  /** Current run of scheduled days met, worked out by the server. */
  rhythms: Record<string, number>;
}

export interface ConsistencyMoment {
  habitId: string;
  habitName: string;
  days: number;
  xpAwarded: number;
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

export interface FocusLobbyMember {
  id: string;
  name: string;
  status: "ready" | "waiting";
  note: string;
}

export interface FocusLobby {
  squadName: string;
  lengthMinutes: number;
  startsInSeconds: number;
  members: FocusLobbyMember[];
}

export interface SaveFocusInput {
  taskId: string | null;
  focusedSeconds: number;
  plannedMinutes: number;
  mode: "solo" | "squad";
  stopReason?: string | null;
}

export interface SaveFocusResult {
  focusedSeconds: number;
  xpAwarded: number;
  weekFocusedMinutes: number;
  companion: CompanionState;
}
