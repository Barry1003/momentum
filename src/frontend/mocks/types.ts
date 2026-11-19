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
  /** Set by the scheduler: the day it starts, and whether it repeats daily from then. */
  scheduledDate?: string;
  repeatsDaily?: boolean;
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
  goalId?: string;
  selectedDate?: string;
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
  /** Short line under the name, e.g. "20 min". */
  detail?: string;
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

export type MilestoneStatus = "reached" | "current" | "later";

export interface GoalMilestone {
  id: string;
  title: string;
  status: MilestoneStatus;
  reachedOn?: string;
  criteria: { id: string; label: string; done: boolean }[];
}

export interface GoalTask {
  id: string;
  title: string;
  detail: string;
  isDone: boolean;
  /** The same task on today's list, when it is there. */
  todayTaskId?: string;
  /** Shared goals: the person it is assigned to, and whether they kept it private. */
  assignee?: string;
  isPrivate?: boolean;
}

export interface GoalActivity {
  id: string;
  kind: "task" | "milestone" | "focus" | "added";
  text: string;
  when: string;
}

export interface GoalDetail {
  id: string;
  title: string;
  why: string | null;
  isShared: boolean;
  isPaused: boolean;
  squadName?: string;
  targetLabel: string;
  startedOn: string;
  completedOn: string | null;
  /** Worked out by the server from tasks done; the ring shows it as is. */
  doneCount: number;
  totalCount: number;
  milestones: GoalMilestone[];
  tasks: GoalTask[];
  linkedHabit: { name: string; detail: string } | null;
  activity: GoalActivity[];
  contributors: { name: string; doneCount: number; isOwner: boolean; isYou: boolean }[];
  focusHours: number;
}

export interface StageUpEvent {
  id?: string;
  stage: GrowthStage;
  xp: number;
  days: number;
  extra: string;
}

export interface ProgressSummary {
  from: string;
  to: string;
  activeDays: number;
  focusMinutes: number;
  /** Change against the same length of time just before, or null when there is nothing to compare. */
  focusDeltaMinutes: number | null;
  tasksDone: number;
  habitsKeptPercent: number;
  focusByDay: { iso: string; minutes: number }[];
  habits: { id: string; name: string; icon: Habit["icon"]; met: number; scheduled: number }[];
  bestWeek: { from: string; to: string; activeDays: number } | null;
  byGoal: { id: string; title: string; tasksDone: number; focusMinutes: number; isPaused: boolean }[];
}

export interface Achievement {
  id: string;
  title: string;
  tone: "gold" | "violet" | "mint";
  earnedOn: string | null;
  /** What it asks for, e.g. "5 focus sessions of 25+ min". */
  criteria: string;
  icon: "check" | "play" | "water" | "person" | "read" | "sparkle";
  xp: number;
  isShared: boolean;
  progress: { done: number; total: number } | null;
  /** Earned: what counted. In progress: the steps so far. */
  counted: { title: string; detail: string; done: boolean }[];
  headline: string;
  body: string;
}

export interface StudioOption {
  id: string;
  label: string;
  detail: string;
  status: "selected" | "available" | "earned" | "locked" | "soon";
  /** Why it is locked, e.g. "Unlocks at Young Adult". */
  unlock?: string;
}

export interface StudioState {
  name: string;
  room: string;
  plinth: string;
  outfit: string;
  rooms: StudioOption[];
  accents: StudioOption[];
  outfits: StudioOption[];
  extras: StudioOption[];
  styles: StudioOption[];
  plinths: { id: string; label: string; color: string }[];
}

export interface CompanionOverview {
  stage: GrowthStage;
  xp: number;
  xpToNextStage: number | null;
  /** Server estimate, e.g. "About 2 weeks at your usual pace". */
  paceNote: string | null;
  mood: string;
  stages: { stage: GrowthStage; from: number; unlockedOn: string | null }[];
  achievementsEarned: number;
  achievementsClose: number;
}

export interface ProfileSummary {
  displayName: string;
  handle: string;
  squadName: string | null;
  squadMembers: number;
  activeDays: number;
}

export interface GoalSnapshot {
  id: string;
  title: string;
  startedOn: string;
  isShared: boolean;
  doneCount: number;
  totalCount: number;
  focusHours: number;
  areasActive: number;
  reviews: number;
  recent: { id: string; title: string; detail: string; isDone: boolean }[];
}

export interface SquadProgress {
  hasSquad: boolean;
  squadName: string;
  focusedHours: number;
  tasksDone: number;
  checkedIn: number;
  members: number;
  sharedGoal: { id: string; title: string; doneCount: number; totalCount: number } | null;
  moments: { id: string; name: string; text: string; when: string; canCheer: boolean }[];
}

export type Mood = "heavy" | "low" | "okay" | "good" | "bright";
export type Effort = "rest" | "light" | "steady" | "strong" | "allIn";

export interface CheckInInput {
  mood: Mood;
  effort: Effort;
  win: string;
  obstacle: string;
  shareCheckedIn: boolean;
}

export interface CheckInStatus {
  doneToday: boolean;
  /** What saving today's check-in earns, decided by the server. */
  xpForCheckIn: number;
}

export interface PrivacySettings {
  shareCheckedIn: boolean;
  shareFocusStatus: boolean;
  shareFinishedSharedTasks: boolean;
  shareGrowthStage: boolean;
  shareStreaksAndXp: boolean;
}

export interface ReminderSettings {
  morningPlan: boolean;
  morningPlanTime: string;
  eveningCheckIn: boolean;
  eveningCheckInTime: string;
  habitReminders: boolean;
  squadCheers: boolean;
  reviewDay: boolean;
}

export type QuietDays = "everyDay" | "weeknights" | "weekends" | "custom";

export interface QuietHours {
  enabled: boolean;
  from: string;
  to: string;
  days: QuietDays;
  customDays: number[];
}

export interface ProfileDetails {
  handle: string;
  intention: string;
}

export interface AccountPreview {
  email: string;
  pendingEmail: string | null;
  export: { state: "none" | "preparing" | "ready"; requestedAt: string | null; fileName: string | null };
  ownsSquadAlone: boolean;
  squadName: string | null;
  deletionScheduledFor: string | null;
}

export type AuditIcon = "rest" | "learning" | "work" | "people" | "health" | "money" | "home" | "spark";

export interface AuditArea {
  id: string;
  name: string;
  icon: AuditIcon;
  /** 1 needs room … 5 well supported; null until reflected on. Never summed into a score. */
  rating: number | null;
  note: string;
}

export interface AuditQuestion {
  id: string;
  topic: string;
  prompt: string;
  hint: string;
  answer: string;
}

export type ActionRhythm = "once" | "daily" | "weekly" | "monthly" | "seasonal";

export interface GridAction {
  id: string;
  areaId: string;
  title: string;
  minutes: number;
  addAs: "task" | "habit";
  rhythm: ActionRhythm;
  /** draft: yours, not in your plan. suggestion: Ari's idea. accepted: in Planner or Habits. */
  status: "draft" | "suggestion" | "accepted";
  rhythmChangedByYou: boolean;
}

export interface GridArea {
  id: string;
  name: string;
  isDraft: boolean;
}

export interface HaradaGrid {
  goalId: string;
  goalTitle: string;
  why: string;
  areas: GridArea[];
  actions: GridAction[];
}

export interface GrowthStudioState {
  areas: AuditArea[];
  questions: AuditQuestion[];
  lastPausedAreaId: string | null;
  grid: HaradaGrid | null;
  /** Draft grid suggested from the reflections; nothing is saved until used. */
  suggestedAreas: { name: string; quote: string | null }[];
  reviewOpensInDays: number;
}

export interface AcceptHabitOptions {
  days: number[];
  targetMinutes: number;
  reminderTime: string | null;
}

export type Quadrant = "doNext" | "planTime" | "reconsider" | "leaveRoom";

export interface SchedulerItem {
  taskId: string;
  title: string;
  minutes: number;
  detail: string;
  quadrant: Quadrant;
  time: string | null;
  scheduledDate: string | null;
  repeatsDaily: boolean;
  goalName: string | null;
  priority: TaskPriority;
  fromGrowthStudio: boolean;
}

export interface BusyBlock {
  title: string;
  from: string;
  to: string;
  note?: string;
}

export interface SlotCheck {
  ok: boolean;
  reason: "invalid" | "conflict" | null;
  conflict: BusyBlock | null;
  /** A free start time the server suggests instead. */
  suggestion: string | null;
}

export interface ReviewState {
  cycle: number;
  from: string;
  to: string;
  status: "open" | "saved";
  stats: { tried: number; total: number; daysActive: number; xpEarned: number };
  tried: { title: string; detail: string }[];
  notTried: { title: string; detail: string }[];
  obstacles: string[];
  context: string;
  suggestions: ReviewChange[];
  xpAwarded: number;
  nextFrom: string;
  nextTo: string;
}

export interface ReviewChange {
  id: string;
  kind: "keep" | "smaller" | "new";
  title: string;
  detail: string;
  /** For smaller/new: the grid draft it became after saving. */
  draftActionId?: string | null;
}
