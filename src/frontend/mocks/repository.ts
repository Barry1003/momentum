import { mockAchievements, mockCompanion, mockFocusLobby, mockSquadMoments, mockHabits, mockNotifications, mockPlanner, mockSquadMembers, mockTasks, mockWeekFocusedMinutes } from "./data";
import { MOMENT_XP, addDays, currentRun, isScheduledOn, isoDate } from "./habitRules";
import { mockGoals } from "./goalsData";
import { STAGE_EXTRAS, STAGE_THRESHOLDS, nextStageState } from "./progressRules";
import type { AcceptHabitOptions, AuditArea, GridAction, GrowthStudioState, AccountPreview, PrivacySettings, ProfileDetails, QuietHours, ReminderSettings, GrowthStage, Achievement, CheckInInput, CompanionOverview, ProfileSummary, StudioOption, StudioState, CheckInStatus, GoalSnapshot, ProgressSummary, SquadProgress, StageUpEvent, CompanionState, ConsistencyMoment, GoalDetail, GoalTask, PlannerGoal, TaskPriority, TaskWhen, FocusLobby, Habit, HabitTracker, SaveFocusInput, SaveFocusResult, HabitsData, NewHabitInput, NewTaskInput, NotificationItem, PlannerData, PlannerListTask, SquadData, Task, TodayData } from "./types";

const MOCK_LATENCY_MS = 250;
const TASK_COMPLETE_XP = 10;
const HABIT_COMPLETE_XP = 5;

// In-memory mock "server" state. Every mutation below plays the role of a
// backend response: callers only ever see values this module computed, so
// the UI never has to derive XP itself.
let companion: CompanionState = { ...mockCompanion };
let tasks: Task[] = mockTasks.map((task) => ({ ...task }));
let habits: Habit[] = mockHabits.map((habit) => ({ ...habit }));
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];
const awardedMoments = new Set<string>();

function todayIso(): string {
  return isoDate(new Date());
}

function rules(habit: Habit) {
  return {
    scheduleDays: habit.scheduleDays ?? EVERY_DAY,
    targetCount: habit.targetCount,
    startsOn: habit.startsOn,
    pausedFrom: habit.pausedFrom,
    pausedUntil: habit.pausedUntil,
  };
}

/** Sixty days of believable history, so rhythms, weeks and months have something to show. */
function seedHistory(): Record<string, Record<string, number>> {
  const today = todayIso();
  const history: Record<string, Record<string, number>> = {};
  for (const habit of habits) {
    history[habit.id] = { [today]: habit.completedCount };
    for (let back = 1; back <= 60; back += 1) {
      const iso = addDays(today, -back);
      if (!isScheduledOn(rules(habit), iso)) continue;
      let count = 0;
      if (habit.id === "habit-1") count = back <= 13 || (back !== 14 && back % 5 !== 0) ? 8 : 5;
      else if (habit.id === "habit-2") count = back % 6 === 3 ? 0 : 1;
      else if (habit.id === "habit-3") count = back <= 11 || (back !== 12 && back % 4 !== 0) ? 1 : 0;
      else count = back % 3 === 1 ? 0 : 1;
      history[habit.id][iso] = count;
    }
  }
  return history;
}

let habitHistory = seedHistory();

/** Today's view of a habit, as the server would send it. */
function withToday(habit: Habit): Habit {
  return { ...habit, isScheduledToday: isScheduledOn(rules(habit), todayIso()) };
}

function visibleHabits(): Habit[] {
  return habits.filter((habit) => !habit.archived).map(withToday);
}
const squadMembers = mockSquadMembers.map((member) => ({ ...member }));
let notifications: NotificationItem[] = mockNotifications.map((item) => ({ ...item }));
let planner: PlannerData = structuredClone(mockPlanner);
let goals: GoalDetail[] = structuredClone(mockGoals);
const MILESTONE_XP = 60;
const GOAL_XP = 200;
let weekFocusedMinutes = mockWeekFocusedMinutes;
let todayFocusMinutes = 0;
const savedFocusSessions = new Set<string>();
let nextId = 100;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

const JOURNEY_STARTED = "2026-10-11";
let pendingStageUp: StageUpEvent | null = null;
let stageReachedOn: Partial<Record<GrowthStage, string>> = {};

/**
 * The only place XP changes. Stages follow XP forward and never back, and
 * crossing into a new stage leaves a "stage up" for the app to celebrate.
 */
function awardXp(amount: number): CompanionState {
  const xp = Math.max(0, companion.xp + amount);
  const { stage, xpToNextStage } = nextStageState(companion.stage, xp);
  if (stage !== companion.stage) {
    const days = Math.max(1, Math.round((Date.now() - new Date(`${JOURNEY_STARTED}T00:00:00`).getTime()) / 86_400_000));
    pendingStageUp = { stage, xp, days, extra: STAGE_EXTRAS[stage] };
    stageReachedOn = { ...stageReachedOn, [stage]: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }) };
    if (typeof window !== "undefined") window.dispatchEvent(new Event("momentum:stage-up"));
  }
  companion = { ...companion, xp, stage, xpToNextStage };
  return companion;
}

export async function getPendingStageUp(): Promise<StageUpEvent | null> {
  return delay(pendingStageUp);
}

export async function acknowledgeStageUp(): Promise<void> {
  pendingStageUp = null;
  return delay(undefined);
}

export async function getToday(): Promise<TodayData> {
  return delay({
    date: new Date().toISOString().slice(0, 10),
    companion,
    tasks,
    habits: visibleHabits().filter((habit) => habit.isScheduledToday),
    isCheckInPromptVisible: true,
  });
}

export async function completeTask(
  taskId: string,
): Promise<{ task: Task; companion: CompanionState; xpAwarded: number }> {
  const before = tasks.find((item) => item.id === taskId);
  if (!before) throw new Error(`Unknown task: ${taskId}`);
  if (before.isDone) return delay({ task: before, companion, xpAwarded: 0 });
  tasks = tasks.map((task) => (task.id === taskId ? { ...task, isDone: true } : task));
  syncGoalTask(taskId, true);
  const task = { ...before, isDone: true };
  const nextCompanion = awardXp(TASK_COMPLETE_XP);
  return delay({ task, companion: nextCompanion, xpAwarded: TASK_COMPLETE_XP });
}

/** Undo a completion: the server takes back exactly the XP it gave. */
export async function undoCompleteTask(taskId: string): Promise<{ task: Task; companion: CompanionState }> {
  const before = tasks.find((item) => item.id === taskId);
  if (!before) throw new Error(`Unknown task: ${taskId}`);
  if (!before.isDone) return delay({ task: before, companion });
  tasks = tasks.map((task) => (task.id === taskId ? { ...task, isDone: false } : task));
  syncGoalTask(taskId, false);
  const nextCompanion = awardXp(-TASK_COMPLETE_XP);
  return delay({ task: { ...before, isDone: false }, companion: nextCompanion });
}

export async function getHabits(): Promise<HabitsData> {
  return delay({ habits: visibleHabits() });
}

export async function getHabitTracker(): Promise<HabitTracker> {
  const today = todayIso();
  const list = visibleHabits();
  const rhythms = Object.fromEntries(list.map((habit) => [habit.id, currentRun(rules(habit), habitHistory[habit.id] ?? {}, today)]));
  return delay({ todayIso: today, habits: list, history: structuredClone(habitHistory), rhythms });
}

export async function incrementHabit(
  habitId: string,
): Promise<{ habit: Habit; companion: CompanionState; moment: ConsistencyMoment | null }> {
  const before = habits.find((item) => item.id === habitId);
  if (!before) throw new Error(`Unknown habit: ${habitId}`);
  const today = todayIso();
  const scheduled = isScheduledOn(rules(before), today);
  // Nothing to log past the target, or on a day the habit does not ask for: no XP either.
  if (!scheduled || before.completedCount >= before.targetCount) {
    return delay({ habit: withToday(before), companion, moment: null });
  }
  const updated = { ...before, completedCount: before.completedCount + 1 };
  habits = habits.map((habit) => (habit.id === habitId ? updated : habit));
  habitHistory = { ...habitHistory, [habitId]: { ...(habitHistory[habitId] ?? {}), [today]: updated.completedCount } };
  let nextCompanion = awardXp(HABIT_COMPLETE_XP);

  let moment: ConsistencyMoment | null = null;
  if (updated.completedCount === updated.targetCount) {
    const days = currentRun(rules(updated), habitHistory[habitId], today);
    const momentKey = `${habitId}:${days}:${today}`;
    if (MOMENT_XP[days] && !awardedMoments.has(momentKey)) {
      awardedMoments.add(momentKey);
      nextCompanion = awardXp(MOMENT_XP[days]);
      moment = { habitId, habitName: updated.name, days, xpAwarded: MOMENT_XP[days] };
    }
  }
  return delay({ habit: withToday(updated), companion: nextCompanion, moment });
}

export interface HabitChanges {
  scheduleDays?: number[];
  targetCount?: number;
}

/** Schedule and target changes apply from tomorrow; history stays as it was. */
export async function updateHabit(habitId: string, changes: HabitChanges): Promise<Habit> {
  const before = habits.find((item) => item.id === habitId);
  if (!before) throw new Error(`Unknown habit: ${habitId}`);
  const scheduleDays = changes.scheduleDays?.filter((day) => day >= 0 && day <= 6);
  const updated: Habit = {
    ...before,
    scheduleDays: scheduleDays && scheduleDays.length ? [...new Set(scheduleDays)].sort((a, b) => a - b) : before.scheduleDays,
    targetCount: changes.targetCount && changes.targetCount > 0 ? Math.min(999, Math.round(changes.targetCount)) : before.targetCount,
  };
  // Today keeps the plan it started with.
  if (updated.targetCount !== before.targetCount) updated.completedCount = Math.min(before.completedCount, updated.targetCount);
  habits = habits.map((habit) => (habit.id === habitId ? updated : habit));
  return delay(withToday(updated));
}

/** Pause from tomorrow. `weeks: null` pauses until resumed. Past days are untouched. */
export async function pauseHabit(habitId: string, weeks: number | null): Promise<Habit> {
  const before = habits.find((item) => item.id === habitId);
  if (!before) throw new Error(`Unknown habit: ${habitId}`);
  const from = addDays(todayIso(), 1);
  const updated: Habit = { ...before, pausedFrom: from, pausedUntil: weeks ? addDays(from, weeks * 7 - 1) : null };
  habits = habits.map((habit) => (habit.id === habitId ? updated : habit));
  return delay(withToday(updated));
}

export async function resumeHabit(habitId: string): Promise<Habit> {
  const before = habits.find((item) => item.id === habitId);
  if (!before) throw new Error(`Unknown habit: ${habitId}`);
  const updated: Habit = { ...before, pausedFrom: null, pausedUntil: null };
  habits = habits.map((habit) => (habit.id === habitId ? updated : habit));
  return delay(withToday(updated));
}

/** Archive stops the habit and keeps every day of its history. */
export async function archiveHabit(habitId: string): Promise<void> {
  habits = habits.map((habit) => (habit.id === habitId ? { ...habit, archived: true } : habit));
  return delay(undefined);
}

export async function getSquad(): Promise<SquadData> {
  return delay({ hasSquad: squadMembers.length > 0, members: squadMembers });
}

export async function addTask(input: NewTaskInput): Promise<{ task: Task }> {
  const isShared = input.shareWithSquad === true;
  const task: Task = {
    id: `task-${nextId++}`,
    title: input.title.trim(),
    isDone: false,
    isShared,
    sharedByName: isShared ? planner.squadName : undefined,
    durationMinutes: input.durationMinutes,
    category: input.category,
    goalName: input.goalName,
    priority: input.priority,
  };
  const when = input.when ?? "today";
  if (when === "today") {
    tasks = [...tasks, task];
  } else {
    const listTask: PlannerListTask = {
      id: task.id,
      title: task.title,
      detail: when === "tomorrow" ? "Tomorrow" : when === "noDate" ? "No date" : "Date to pick",
      group: when === "tomorrow" ? "thisWeek" : "later",
      isDone: false,
      isShared,
      hasDate: when !== "noDate",
      badge: isShared ? "Shared" : input.priority === "high" ? "P1" : undefined,
    };
    planner = { ...planner, allTasks: [...planner.allTasks, listTask] };
  }
  return delay({ task });
}

function toPlannerGoal(goal: GoalDetail): PlannerGoal {
  return {
    id: goal.id,
    title: goal.title,
    doneCount: goal.doneCount,
    totalCount: goal.totalCount,
    detail: goal.isShared
      ? `${goal.squadName ?? "Squad"} · shared · ${goal.targetLabel}`
      : `Personal · ${goal.targetLabel === "no target" ? "no target" : `target ${goal.targetLabel}`}`,
    isShared: goal.isShared,
    isPaused: goal.isPaused,
  };
}

export async function getPlanner(): Promise<PlannerData> {
  planner = {
    ...planner,
    goals: goals.map(toPlannerGoal),
    suggestedActionCount: studio.grid ? studio.grid.actions.filter((action) => action.status !== "accepted").length : 0,
  };
  return delay(planner);
}

// ---------------------------------------------------------------- goals

/** A today task and its goal task are one task: finishing either finishes both. */
function syncGoalTask(todayTaskId: string, isDone: boolean): void {
  goals = goals.map((goal) => {
    const linked = goal.tasks.find((task) => task.todayTaskId === todayTaskId);
    if (!linked || linked.isDone === isDone) return goal;
    return {
      ...goal,
      doneCount: Math.max(0, goal.doneCount + (isDone ? 1 : -1)),
      tasks: goal.tasks.map((task) => (task.id === linked.id ? { ...task, isDone, detail: isDone ? "Done today" : task.detail } : task)),
      activity: isDone
        ? [{ id: `a-${nextId++}`, kind: "task" as const, text: `${linked.title} completed`, when: "Today" }, ...goal.activity]
        : goal.activity,
    };
  });
}

function findGoal(goalId: string): GoalDetail {
  const goal = goals.find((item) => item.id === goalId);
  if (!goal) throw new Error(`Unknown goal: ${goalId}`);
  return goal;
}

function replaceGoal(next: GoalDetail): GoalDetail {
  goals = goals.map((goal) => (goal.id === next.id ? next : goal));
  return next;
}

export async function getGoal(goalId: string): Promise<GoalDetail | null> {
  return delay(goals.find((goal) => goal.id === goalId) ?? null);
}

export async function createGoal(input: { title: string; why?: string }): Promise<GoalDetail> {
  const title = input.title.trim().slice(0, 80);
  if (title.length < 2) throw new Error("A goal needs a short name.");
  const goal: GoalDetail = {
    id: `g-${nextId++}`,
    title,
    why: input.why?.trim() || null,
    isShared: false,
    isPaused: false,
    targetLabel: "no target",
    startedOn: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    completedOn: null,
    doneCount: 0,
    totalCount: 0,
    milestones: [],
    tasks: [],
    linkedHabit: null,
    activity: [],
    contributors: [],
    focusHours: 0,
  };
  goals = [...goals, goal];
  return delay(goal);
}

/** Finish a goal's task. XP comes from here; the same task on today's list is finished too. */
export async function completeGoalTask(goalId: string, goalTaskId: string): Promise<{ goal: GoalDetail; companion: CompanionState; xpAwarded: number }> {
  const goal = findGoal(goalId);
  const task = goal.tasks.find((item) => item.id === goalTaskId);
  if (!task) throw new Error(`Unknown goal task: ${goalTaskId}`);
  if (task.isDone || task.isPrivate || (goal.isShared && task.assignee !== "You")) {
    return delay({ goal, companion, xpAwarded: 0 });
  }
  if (task.todayTaskId && tasks.some((item) => item.id === task.todayTaskId && !item.isDone)) {
    tasks = tasks.map((item) => (item.id === task.todayTaskId ? { ...item, isDone: true } : item));
  }
  const next = replaceGoal({
    ...goal,
    doneCount: goal.doneCount + 1,
    tasks: goal.tasks.map((item) => (item.id === goalTaskId ? { ...item, isDone: true, detail: "Done today" } : item)),
    activity: [{ id: `a-${nextId++}`, kind: "task", text: `${task.title} completed`, when: "Today" }, ...goal.activity],
  });
  const nextCompanion = awardXp(TASK_COMPLETE_XP);
  return delay({ goal: next, companion: nextCompanion, xpAwarded: TASK_COMPLETE_XP });
}

/** A task added from a goal is linked to it and shows in the Planner too. */
export async function addGoalTask(goalId: string, input: { title: string; when: TaskWhen; priority: TaskPriority }): Promise<GoalDetail> {
  const goal = findGoal(goalId);
  const title = input.title.trim().slice(0, 120);
  if (title.length < 2) throw new Error("A task needs a short name.");
  const { task } = await addTask({ title, when: input.when, priority: input.priority, goalName: goal.title });
  const goalTask: GoalTask = {
    id: `gt-${nextId++}`,
    title,
    detail: input.when === "today" ? "today" : input.when === "tomorrow" ? "tomorrow" : "date to pick",
    isDone: false,
    todayTaskId: input.when === "today" ? task.id : undefined,
    assignee: goal.isShared ? "You" : undefined,
  };
  const next = replaceGoal({
    ...findGoal(goalId),
    totalCount: goal.totalCount + 1,
    tasks: [...goal.tasks, goalTask],
    activity: [{ id: `a-${nextId++}`, kind: "added", text: `${title} added`, when: "Today" }, ...goal.activity],
  });
  return delay(next);
}

export async function toggleCriterion(goalId: string, milestoneId: string, criterionId: string): Promise<GoalDetail> {
  const goal = findGoal(goalId);
  const next = replaceGoal({
    ...goal,
    milestones: goal.milestones.map((milestone) =>
      milestone.id === milestoneId && milestone.status !== "reached"
        ? { ...milestone, criteria: milestone.criteria.map((item) => (item.id === criterionId ? { ...item, done: !item.done } : item)) }
        : milestone,
    ),
  });
  return delay(next);
}

/**
 * The person confirms a milestone; confirming is what makes it count.
 * Reaching the last one reaches the goal. Repeat calls award nothing.
 */
export async function confirmMilestone(
  goalId: string,
  milestoneId: string,
): Promise<{ goal: GoalDetail; companion: CompanionState; xpAwarded: number; goalReachedXp: number | null }> {
  const goal = findGoal(goalId);
  const index = goal.milestones.findIndex((item) => item.id === milestoneId);
  if (index < 0 || goal.milestones[index].status !== "current") {
    return delay({ goal, companion, xpAwarded: 0, goalReachedXp: null });
  }
  const reachedOn = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const milestones = goal.milestones.map((milestone, position) => {
    if (position === index) return { ...milestone, status: "reached" as const, reachedOn };
    if (position === index + 1 && milestone.status === "later") return { ...milestone, status: "current" as const };
    return milestone;
  });
  const allReached = milestones.every((milestone) => milestone.status === "reached");
  let nextCompanion = awardXp(MILESTONE_XP);
  if (allReached) nextCompanion = awardXp(GOAL_XP);
  const next = replaceGoal({
    ...goal,
    milestones,
    completedOn: allReached ? reachedOn : null,
    activity: [{ id: `a-${nextId++}`, kind: "milestone", text: `${goal.milestones[index].title} reached`, when: "Today" }, ...goal.activity],
  });
  return delay({ goal: next, companion: nextCompanion, xpAwarded: MILESTONE_XP, goalReachedXp: allReached ? GOAL_XP : null });
}

/** "Move to today" for yesterday's leftover: it joins today's list, no penalty. */
export async function moveCarryOverToToday(): Promise<{ task: Task | null; planner: PlannerData }> {
  const carry = planner.carryOver;
  if (!carry) return delay({ task: null, planner });
  const task: Task = { id: `task-${nextId++}`, title: carry.title, isDone: false, isShared: false, time: "13:00" };
  tasks = [...tasks, task];
  planner = { ...planner, carryOver: null };
  return delay({ task, planner });
}

/** Pull a task from the full list into today. Its record stays; only its day changes. */
export async function moveListTaskToToday(listTaskId: string): Promise<{ task: Task | null; planner: PlannerData }> {
  const item = planner.allTasks.find((entry) => entry.id === listTaskId);
  if (!item) return delay({ task: null, planner });
  const task: Task = { id: `task-${nextId++}`, title: item.title, isDone: false, isShared: item.isShared, time: "13:00" };
  tasks = [...tasks, task];
  planner = { ...planner, allTasks: planner.allTasks.filter((entry) => entry.id !== listTaskId) };
  return delay({ task, planner });
}

export async function rescheduleCarryOver(): Promise<PlannerData> {
  const carry = planner.carryOver;
  if (!carry) return delay(planner);
  planner = {
    ...planner,
    carryOver: null,
    allTasks: [
      ...planner.allTasks,
      { id: carry.id, title: carry.title, detail: "Date to pick", group: "later", isDone: false, isShared: false, hasDate: false },
    ],
  };
  return delay(planner);
}

export async function addHabit(input: NewHabitInput): Promise<{ habit: Habit }> {
  const kind = input.kind ?? (input.targetCount > 1 ? "target" : "tick");
  const scheduleDays = input.scheduleDays?.filter((day) => day >= 0 && day <= 6) ?? [];
  const habit: Habit = {
    id: `habit-${nextId++}`,
    kind,
    unit: kind === "target" ? input.unit?.trim() || "times" : undefined,
    detail: input.detail?.trim().slice(0, 60) || undefined,
    scheduleDays: scheduleDays.length ? [...new Set(scheduleDays)].sort((a, b) => a - b) : EVERY_DAY,
    startsOn: input.startsTomorrow ? addDays(todayIso(), 1) : undefined,
    reminderTime: input.reminderTime ?? null,
    goalName: input.goalName ?? null,
    shareWithSquad: input.shareWithSquad === true,
    name: input.name.trim(),
    targetCount: kind === "target" ? Math.max(1, input.targetCount) : 1,
    completedCount: 0,
    isScheduledToday: true,
    icon: "sparkle",
  };
  habits = [...habits, habit];
  habitHistory = { ...habitHistory, [habit.id]: {} };
  return delay({ habit: withToday(habit) });
}

export async function getNotifications(): Promise<NotificationItem[]> {
  return delay(notifications);
}

export async function markAllNotificationsRead(): Promise<NotificationItem[]> {
  notifications = notifications.map((item) => ({ ...item, isRead: true }));
  return delay(notifications);
}

/** Server rule (mock): one XP for every started five minutes of real focus, none under a minute. */
function focusXpFor(focusedSeconds: number): number {
  if (focusedSeconds < 60) return 0;
  return Math.ceil(focusedSeconds / 60 / 5);
}

/** What saving this much focus would earn, for the finish-early question. Server-side rule. */
export async function quoteFocusXp(focusedSeconds: number): Promise<number> {
  return delay(focusXpFor(Math.max(0, Math.floor(focusedSeconds))));
}

export async function getFocusLobby(): Promise<FocusLobby> {
  return delay(mockFocusLobby);
}

/**
 * Save a finished or stopped session. `sessionKey` makes retries safe: saving
 * the same session twice (e.g. after a timeout or an offline retry) awards XP once.
 */
export async function saveFocusSession(sessionKey: string, input: SaveFocusInput): Promise<SaveFocusResult> {
  const focusedSeconds = Math.max(0, Math.min(Math.floor(input.focusedSeconds), input.plannedMinutes * 60));
  if (savedFocusSessions.has(sessionKey)) {
    return delay({ focusedSeconds, xpAwarded: 0, weekFocusedMinutes, companion });
  }
  savedFocusSessions.add(sessionKey);
  const xpAwarded = focusXpFor(focusedSeconds);
  weekFocusedMinutes += Math.round(focusedSeconds / 60);
  todayFocusMinutes += Math.round(focusedSeconds / 60);
  const day = todayIso();
  if (focusedSeconds >= 60 && !focusDays.has(day)) {
    focusDays.add(day);
    stepAchievement("finding-rhythm", {
      title: new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" }),
      detail: `${Math.round(focusedSeconds / 60)} min`,
    });
  }
  const nextCompanion = awardXp(xpAwarded);
  return delay({ focusedSeconds, xpAwarded, weekFocusedMinutes, companion: nextCompanion });
}

// ---------------------------------------------------------------- progress

/** Believable focus minutes and finished tasks for past days; today comes from live data. */
const focusLog: Record<string, number> = {};
const tasksLog: Record<string, number> = {};
(function seedProgress() {
  const today = isoDate(new Date());
  const focusPattern = [42, 64, 18, 0, 72, 80, 38];
  const taskPattern = [2, 3, 1, 0, 3, 2, 1];
  for (let back = 1; back <= 90; back += 1) {
    const iso = addDays(today, -back);
    const weekday = (new Date(`${iso}T12:00:00`).getDay() + 6) % 7;
    const wobble = (back * 7) % 5;
    focusLog[iso] = back % 9 === 0 ? 0 : focusPattern[weekday] + wobble * 3;
    tasksLog[iso] = back % 9 === 0 ? 0 : taskPattern[weekday] + (wobble > 3 ? 1 : 0);
  }
})();

function focusOn(iso: string): number {
  const extra = iso === todayIso() ? todayFocusMinutes : 0;
  return (focusLog[iso] ?? 0) + extra;
}

function tasksOn(iso: string): number {
  if (iso === todayIso()) return tasks.filter((task) => task.isDone).length;
  return tasksLog[iso] ?? 0;
}

function habitMetOn(habit: Habit, iso: string): boolean {
  return (habitHistory[habit.id]?.[iso] ?? 0) >= habit.targetCount;
}

function datesBetween(from: string, to: string): string[] {
  const dates: string[] = [];
  for (let iso = from; iso <= to && dates.length < 366; iso = addDays(iso, 1)) dates.push(iso);
  return dates;
}

function summarise(from: string, to: string): Omit<ProgressSummary, "focusDeltaMinutes" | "bestWeek"> {
  const dates = datesBetween(from, to);
  const live = habits.filter((habit) => !habit.archived);
  const habitRows = live.map((habit) => {
    const scheduledDays = dates.filter((iso) => isScheduledOn(rules(habit), iso));
    return { id: habit.id, name: habit.name, icon: habit.icon, met: scheduledDays.filter((iso) => habitMetOn(habit, iso)).length, scheduled: scheduledDays.length };
  });
  const scheduled = habitRows.reduce((sum, row) => sum + row.scheduled, 0);
  const met = habitRows.reduce((sum, row) => sum + row.met, 0);
  const activeDays = dates.filter((iso) => focusOn(iso) > 0 || tasksOn(iso) > 0 || live.some((habit) => (habitHistory[habit.id]?.[iso] ?? 0) > 0)).length;
  const focusMinutes = dates.reduce((sum, iso) => sum + focusOn(iso), 0);
  const tasksDone = dates.reduce((sum, iso) => sum + tasksOn(iso), 0);
  const share = Math.min(1, dates.length / 60);
  return {
    from,
    to,
    activeDays,
    focusMinutes,
    tasksDone,
    habitsKeptPercent: scheduled ? Math.round((met / scheduled) * 100) : 0,
    focusByDay: dates.slice(-7).map((iso) => ({ iso, minutes: focusOn(iso) })),
    habits: habitRows,
    byGoal: goals
      .filter((goal) => !goal.isShared)
      .map((goal) => ({
        id: goal.id,
        title: goal.title,
        tasksDone: goal.isPaused ? 0 : Math.round(goal.doneCount * share),
        focusMinutes: goal.isPaused ? 0 : Math.round(goal.focusHours * 60 * share),
        isPaused: goal.isPaused,
      })),
  };
}

/** Totals for any range up to today. Nothing in the future is ever counted. */
export async function getProgress(fromIso: string, toIso: string): Promise<ProgressSummary> {
  const today = todayIso();
  const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);
  let to = valid(toIso) ? toIso : today;
  let from = valid(fromIso) ? fromIso : to;
  if (from > to) [from, to] = [to, from];
  if (to > today) to = today;
  if (from > to) from = to;
  if (datesBetween(from, to).length >= 366) from = addDays(to, -365);
  const current = summarise(from, to);
  const length = datesBetween(from, to).length;
  const before = summarise(addDays(from, -length), addDays(from, -1));

  let bestWeek: ProgressSummary["bestWeek"] = null;
  for (let start = from; start <= to; start = addDays(start, 7)) {
    const end = addDays(start, 6) > to ? to : addDays(start, 6);
    const week = summarise(start, end);
    if (!bestWeek || week.activeDays > bestWeek.activeDays) bestWeek = { from: start, to: end, activeDays: week.activeDays };
  }
  return delay({ ...current, focusDeltaMinutes: current.focusMinutes - before.focusMinutes, bestWeek: length >= 14 ? bestWeek : null });
}

let achievements: Achievement[] = structuredClone(mockAchievements);
let pendingAchievement: Achievement | null = null;

export async function getAchievements(): Promise<Achievement[]> {
  return delay(achievements);
}

export async function getAchievement(id: string): Promise<Achievement | null> {
  return delay(achievements.find((item) => item.id === id) ?? null);
}

/** Achievements are private unless the person chooses to share one. */
export async function setAchievementShared(id: string, isShared: boolean): Promise<Achievement | null> {
  achievements = achievements.map((item) => (item.id === id && item.earnedOn ? { ...item, isShared } : item));
  return delay(achievements.find((item) => item.id === id) ?? null);
}

export async function getPendingAchievement(): Promise<Achievement | null> {
  return delay(pendingAchievement);
}

export async function acknowledgeAchievement(): Promise<void> {
  pendingAchievement = null;
  return delay(undefined);
}

/** Progress an achievement by one step, earning it (and its XP) when complete. */
function stepAchievement(id: string, step: { title: string; detail: string }): void {
  const item = achievements.find((entry) => entry.id === id);
  const progress = item?.progress;
  if (!item || item.earnedOn || !progress) return;
  const done = progress.done + 1;
  const counted = [...item.counted.filter((entry) => entry.done), { ...step, done: true }];
  if (done >= progress.total) {
    const earnedOn = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const earned = { ...item, earnedOn, progress: null, counted };
    achievements = achievements.map((entry) => (entry.id === id ? earned : entry));
    awardXp(item.xp);
    pendingAchievement = earned;
    if (typeof window !== "undefined") window.dispatchEvent(new Event("momentum:achievement"));
  } else {
    achievements = achievements.map((entry) =>
      entry.id === id
        ? { ...entry, progress: { ...progress, done }, counted: [...counted, { title: "Any day you like", detail: `${progress.total - done} more to go`, done: false }] }
        : entry,
    );
  }
}

const focusDays = new Set<string>();

export async function getGoalSnapshot(goalId: string): Promise<GoalSnapshot | null> {
  const goal = goals.find((item) => item.id === goalId);
  if (!goal) return delay(null);
  return delay({
    id: goal.id,
    title: goal.title,
    startedOn: goal.startedOn,
    isShared: goal.isShared,
    doneCount: goal.doneCount,
    totalCount: goal.totalCount,
    focusHours: goal.focusHours,
    areasActive: goal.milestones.filter((milestone) => milestone.status !== "later").length,
    reviews: goal.isShared ? 0 : 2,
    recent: goal.tasks
      .filter((task) => !task.isPrivate)
      .slice(-3)
      .reverse()
      .map((task) => ({ id: task.id, title: task.title, detail: task.isDone ? task.detail : `${task.detail} · not yet`, isDone: task.isDone })),
  });
}

const cheered = new Set<string>();

/** Squad totals: only what each person chose to share, never a ranking. */
export async function getSquadProgress(): Promise<SquadProgress> {
  const shared = goals.find((goal) => goal.isShared) ?? null;
  const youCheckedIn = Boolean(checkIns[todayIso()]?.shareCheckedIn);
  const moments = mockSquadMoments.map((moment) => ({ ...moment, canCheer: !cheered.has(moment.id) }));
  if (companion.stage === "youngAdult" || companion.stage === "adult") {
    moments.push({ id: "sm-you", name: "You", text: companion.stage === "adult" ? "Ari became an Adult" : "Ari became a Young Adult", when: "Recently", canCheer: false });
  }
  return delay({
    hasSquad: squadMembers.length > 0,
    squadName: planner.squadName,
    focusedHours: 21,
    tasksDone: 38,
    checkedIn: squadMembers.filter((member) => member.isCheckedInToday).length + (youCheckedIn ? 1 : 0),
    members: squadMembers.length + 1,
    sharedGoal: shared ? { id: shared.id, title: shared.title, doneCount: shared.doneCount, totalCount: shared.totalCount } : null,
    moments,
  });
}

export async function cheerMoment(momentId: string): Promise<void> {
  cheered.add(momentId);
  return delay(undefined);
}

// ---------------------------------------------------------------- check-in

const CHECK_IN_XP = 10;
const checkIns: Record<string, CheckInInput> = {};

export async function getCheckInStatus(): Promise<CheckInStatus> {
  return delay({ doneToday: Boolean(checkIns[todayIso()]), xpForCheckIn: checkIns[todayIso()] ? 0 : CHECK_IN_XP });
}

/** One check-in a day earns XP; saving again updates the words but earns nothing more. */
export async function saveCheckIn(input: CheckInInput): Promise<{ xpAwarded: number; companion: CompanionState }> {
  const today = todayIso();
  const clean: CheckInInput = {
    mood: input.mood,
    effort: input.effort,
    win: input.win.trim().slice(0, 500),
    obstacle: input.obstacle.trim().slice(0, 500),
    shareCheckedIn: input.shareCheckedIn === true,
  };
  const first = !checkIns[today];
  checkIns[today] = clean;
  const next = first ? awardXp(CHECK_IN_XP) : companion;
  return delay({ xpAwarded: first ? CHECK_IN_XP : 0, companion: next });
}

// ---------------------------------------------------------------- companion, studio, profile

const STAGE_ORDER: GrowthStage[] = ["child", "preteen", "teen", "youngAdult", "adult"];
const UNLOCKED_ON: Record<GrowthStage, string> = { child: "2 Sep", preteen: "19 Sep", teen: "12 Oct", youngAdult: "", adult: "" };

function stageAtLeast(stage: GrowthStage): boolean {
  return STAGE_ORDER.indexOf(companion.stage) >= STAGE_ORDER.indexOf(stage);
}

export async function getCompanionOverview(): Promise<CompanionOverview> {
  const xpPerDay = 30;
  const toGo = companion.xpToNextStage ? companion.xpToNextStage - companion.xp : null;
  const days = toGo !== null ? Math.max(1, Math.ceil(toGo / xpPerDay)) : null;
  const latest = Object.entries(checkIns).sort(([a], [b]) => (a < b ? 1 : -1))[0]?.[1];
  const moodWord: Record<string, string> = { heavy: "Gentle", low: "Gentle", okay: "Calm", good: "Happy", bright: "Bright" };
  return delay({
    stage: companion.stage,
    xp: companion.xp,
    xpToNextStage: companion.xpToNextStage,
    paceNote: days === null ? null : days <= 10 ? `About ${days} days at your usual pace.` : `About ${Math.round(days / 7)} weeks at your usual pace.`,
    mood: `${latest ? moodWord[latest.mood] : "Calm"} mood`,
    stages: STAGE_THRESHOLDS.map(({ stage, from }) => ({
      stage,
      from,
      unlockedOn: stageAtLeast(stage) ? stageReachedOn[stage] ?? (UNLOCKED_ON[stage] || "Recently") : null,
    })),
    achievementsEarned: achievements.filter((item) => item.earnedOn).length,
    achievementsClose: achievements.filter((item) => !item.earnedOn && item.progress && item.progress.done / item.progress.total >= 0.6).length,
  });
}

let look = { name: "Ari", room: "lavender", plinth: "cream", outfit: "original", accents: [] as string[] };

function option(id: string, label: string, detail: string, status: StudioOption["status"], unlock?: string): StudioOption {
  return { id, label, detail, status, unlock };
}

function buildStudio(): StudioState {
  const longestRun = Math.max(0, ...habits.map((habit) => currentRun(rules(habit), habitHistory[habit.id] ?? {}, todayIso())));
  const goalDone = goals.some((goal) => goal.completedOn);
  const inSquad = squadMembers.length > 0;
  const deepDiver = achievements.some((item) => item.id === "deep-diver" && item.earnedOn);
  const pick = (id: string, current: string, available: boolean, unlock?: string): StudioOption["status"] =>
    id === current ? "selected" : available ? "available" : unlock ? "locked" : "soon";
  return {
    name: look.name,
    room: look.room,
    plinth: look.plinth,
    outfit: look.outfit,
    rooms: [
      option("lavender", "Lavender nook", "Soft purple · default", pick("lavender", look.room, true)),
      option("sage", "Sage studio", "Calm green walls, a plant, and a little desk lamp", pick("sage", look.room, true)),
      option("sunrise", "Sunrise loft", stageAtLeast("youngAdult") ? "Warm light · earned" : "Unlocks at Young Adult", pick("sunrise", look.room, stageAtLeast("youngAdult"), "Unlocks at Young Adult")),
      option("midnight", "Midnight room", "Coming later", "soon"),
    ],
    accents: [
      option("plant", "Little plant", "Sits on the desk", look.accents.includes("plant") ? "selected" : "available"),
      option("lamp", "Desk lamp", "A warm pool of light", look.accents.includes("lamp") ? "selected" : "available"),
      option("lights", "String lights", "Coming later", "soon"),
    ],
    outfits: [
      option("original", "Ari’s original", "Blue jacket · white hoodie · headphones", look.outfit === "original" ? "selected" : "available"),
      option("coat", "Rainy day coat", deepDiver ? "Earned with “Deep diver” · art arrives soon" : "Unlocks with “Deep diver”", deepDiver ? "earned" : "locked", "Unlocks with “Deep diver”"),
      option("festival", "Festival look", "Coming later", "soon"),
    ],
    extras: [
      option("headphones", "Headphones", "Unlocked", "earned"),
      option("backpack", "Backpack", "7-day rhythm", longestRun >= 7 ? "earned" : "locked", "7-day rhythm"),
      option("aura", "Gold aura", "First goal done", goalDone || stageAtLeast("youngAdult") ? "earned" : "locked", "First goal done"),
      option("scarf", "Squad scarf", "Join a squad", inSquad ? "earned" : "locked", "Join a squad"),
    ],
    styles: [
      option("anime-boy", "Anime · Boy", "Ari", "selected"),
      option("anime-girl", "Anime · Girl", "Art for every stage is coming", "soon"),
      option("anime-bold", "Anime · Bold", "Art for every stage is coming", "soon"),
      option("soft-boy", "Soft 3D · Boy", "Art for every stage is coming", "soon"),
      option("soft-girl", "Soft 3D · Girl", "Art for every stage is coming", "soon"),
    ],
    plinths: [
      { id: "cream", label: "Cream", color: "#f8f0e2" },
      { id: "lavender", label: "Lavender", color: "#ddd2f8" },
      { id: "mint", label: "Mint", color: "#d6f0e6" },
      { id: "peach", label: "Peach", color: "#fbdcc8" },
      { id: "midnight", label: "Midnight", color: "#2f1d66" },
    ],
  };
}

export async function getStudio(): Promise<StudioState> {
  return delay(buildStudio());
}

/**
 * Save a look. Only rooms, accents and outfits the person has can be applied;
 * a look never changes the growth stage or XP.
 */
export async function saveLook(changes: { name?: string; room?: string; plinth?: string; outfit?: string; accents?: string[] }): Promise<StudioState> {
  const studio = buildStudio();
  const usable = (list: StudioOption[], id: string | undefined) =>
    id !== undefined && list.some((item) => item.id === id && (item.status === "selected" || item.status === "available"));
  const name = changes.name?.trim();
  if (name !== undefined && (name.length < 1 || name.length > 20)) throw new Error("Names are 1 to 20 characters.");
  look = {
    name: name ?? look.name,
    room: usable(studio.rooms, changes.room) ? (changes.room as string) : look.room,
    plinth: studio.plinths.some((item) => item.id === changes.plinth) ? (changes.plinth as string) : look.plinth,
    outfit: usable(studio.outfits, changes.outfit) ? (changes.outfit as string) : look.outfit,
    accents: changes.accents ? changes.accents.filter((id) => usable(studio.accents, id) || look.accents.includes(id)) : look.accents,
  };
  return delay(buildStudio());
}

export async function getProfileSummary(displayName: string): Promise<ProfileSummary> {
  const name = displayName.trim() || "Friend";
  const today = todayIso();
  const monday = addDays(today, -((new Date(`${today}T12:00:00`).getDay() + 6) % 7));
  const summary = summarise(monday, today);
  return delay({
    displayName: name,
    handle: `@${name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 15) || "you"}`,
    squadName: squadMembers.length ? planner.squadName : null,
    squadMembers: squadMembers.length + 1,
    activeDays: summary.activeDays,
  });
}

// ---------------------------------------------------------------- settings and account (preview)

let privacy: PrivacySettings = {
  shareCheckedIn: true,
  shareFocusStatus: true,
  shareFinishedSharedTasks: true,
  shareGrowthStage: true,
  shareStreaksAndXp: false,
};
let reminders: ReminderSettings = {
  morningPlan: true,
  morningPlanTime: "08:30",
  eveningCheckIn: true,
  eveningCheckInTime: "21:00",
  habitReminders: true,
  squadCheers: false,
  reviewDay: true,
};
let quiet: QuietHours = { enabled: true, from: "22:00", to: "08:00", days: "everyDay", customDays: [] };
let profileDetails: ProfileDetails = { handle: "", intention: "Build things I’m proud of." };

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const HANDLE = /^[a-z0-9_]{3,15}$/;
const TAKEN_HANDLES = new Set(["zara", "malik", "kemi", "dayo", "momentum", "admin"]);

export async function getPrivacy(): Promise<PrivacySettings> {
  return delay(privacy);
}
export async function savePrivacy(next: PrivacySettings): Promise<PrivacySettings> {
  privacy = {
    shareCheckedIn: next.shareCheckedIn === true,
    shareFocusStatus: next.shareFocusStatus === true,
    shareFinishedSharedTasks: next.shareFinishedSharedTasks === true,
    shareGrowthStage: next.shareGrowthStage === true,
    shareStreaksAndXp: next.shareStreaksAndXp === true,
  };
  return delay(privacy);
}

export async function getReminders(): Promise<ReminderSettings> {
  return delay(reminders);
}
export async function saveReminders(next: ReminderSettings): Promise<ReminderSettings> {
  if (!TIME.test(next.morningPlanTime) || !TIME.test(next.eveningCheckInTime)) throw new Error("Times use HH:MM.");
  reminders = { ...next };
  return delay(reminders);
}

export async function getQuietHours(): Promise<QuietHours> {
  return delay(quiet);
}
export async function saveQuietHours(next: QuietHours): Promise<QuietHours> {
  if (!TIME.test(next.from) || !TIME.test(next.to)) throw new Error("Times use HH:MM.");
  if (next.from === next.to) throw new Error("Start and end can’t be the same time.");
  const customDays = [...new Set(next.customDays.filter((day) => day >= 0 && day <= 6))].sort((a, b) => a - b);
  if (next.days === "custom" && customDays.length === 0) throw new Error("Pick at least one day.");
  quiet = { enabled: next.enabled === true, from: next.from, to: next.to, days: next.days, customDays };
  return delay(quiet);
}

export async function getProfileDetails(displayName: string): Promise<ProfileDetails> {
  if (!profileDetails.handle) {
    profileDetails = { ...profileDetails, handle: displayName.toLowerCase().replace(/[^a-z0-9_]+/g, "").slice(0, 15) || "you" };
  }
  return delay(profileDetails);
}

/** Handles are public and unique; the intention is only ever shown to its owner. */
export async function saveProfileDetails(next: ProfileDetails): Promise<ProfileDetails> {
  const handle = next.handle.trim().replace(/^@/, "").toLowerCase();
  if (!HANDLE.test(handle)) throw new Error("Handles are 3–15 letters, numbers or underscores.");
  if (TAKEN_HANDLES.has(handle)) throw new Error(`@${handle} is taken. Try another.`);
  const intention = next.intention.trim().slice(0, 140);
  profileDetails = { handle, intention };
  return delay(profileDetails);
}

let account: AccountPreview = {
  email: "you@example.com",
  pendingEmail: null,
  export: { state: "none", requestedAt: null, fileName: null },
  ownsSquadAlone: true,
  squadName: "Northstar",
  deletionScheduledFor: null,
};
const PREVIEW_CODE = "482913";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function getAccount(): Promise<AccountPreview> {
  if (account.export.state === "preparing" && account.export.requestedAt && Date.now() - Number(account.export.requestedAt) > 8000) {
    account = { ...account, export: { ...account.export, state: "ready", fileName: `momentum-${todayIso()}.zip` } };
  }
  return delay({ ...account, squadName: squadMembers.length ? planner.squadName : null, ownsSquadAlone: account.ownsSquadAlone && squadMembers.length > 0 });
}

/** Preview: no email is sent. The real flow sends a code to the new address. */
export async function requestEmailChange(newEmail: string): Promise<{ previewCode: string }> {
  const email = newEmail.trim().toLowerCase();
  if (!EMAIL.test(email) || email.length > 254) throw new Error("That email doesn’t look right.");
  if (email === account.email) throw new Error("That’s already your email.");
  account = { ...account, pendingEmail: email };
  return delay({ previewCode: PREVIEW_CODE });
}

export async function confirmEmailChange(code: string): Promise<AccountPreview> {
  if (!account.pendingEmail) throw new Error("Start again: there’s no change waiting.");
  if (code.trim() !== PREVIEW_CODE) throw new Error("That code doesn’t match. Check the latest email.");
  account = { ...account, email: account.pendingEmail, pendingEmail: null };
  return delay(account);
}

export async function requestDataExport(): Promise<AccountPreview> {
  if (account.export.state !== "preparing") {
    account = { ...account, export: { state: "preparing", requestedAt: String(Date.now()), fileName: null } };
  }
  return delay(account);
}

/** Preview: ownership is handed over in Squad settings (02c). Here it just clears the blocker. */
export async function previewTransferOwnership(): Promise<void> {
  account = { ...account, ownsSquadAlone: false };
  return delay(undefined);
}

/** Preview only: nothing is deleted. The real flow schedules deletion for 14 days later. */
export async function requestAccountDeletion(code: string, confirmWord: string): Promise<AccountPreview> {
  if (account.ownsSquadAlone && squadMembers.length > 0) throw new Error("Pass your squad on first.");
  if (code.trim() !== PREVIEW_CODE) throw new Error("That code doesn’t match.");
  if (confirmWord.trim() !== "DELETE") throw new Error("Type DELETE in capitals to confirm.");
  account = { ...account, deletionScheduledFor: addDays(todayIso(), 14) };
  return delay(account);
}

export async function cancelAccountDeletion(): Promise<AccountPreview> {
  account = { ...account, deletionScheduledFor: null };
  return delay(account);
}

// ---------------------------------------------------------------- growth studio

const AUDIT_AREAS: AuditArea[] = [
  { id: "rest", name: "Rest & recovery", icon: "rest", rating: 2, note: "Evenings fill up before I pause." },
  { id: "learning", name: "Learning", icon: "learning", rating: 4, note: "" },
  { id: "work", name: "Work & purpose", icon: "work", rating: 3, note: "" },
  { id: "people", name: "Friends & family", icon: "people", rating: 3, note: "" },
  { id: "health", name: "Health & body", icon: "health", rating: null, note: "" },
  { id: "money", name: "Money", icon: "money", rating: null, note: "" },
  { id: "home", name: "Home & space", icon: "home", rating: null, note: "" },
];

const AUDIT_QUESTIONS = [
  ["Money", "How do you feel about money right now?", "Spending, saving, the worry or the calm.", "I spend before I plan."],
  ["Energy", "When do you have the most energy?", "Times of day, people, places.", "Mornings, if I sleep."],
  ["Daily habits", "What do your days actually look like right now?", "Mornings, evenings, the small things you repeat without thinking.", ""],
  ["Avoiding", "What have you been putting off?", "No judgement. Just name it.", ""],
  ["One year from now", "What would you love to be true a year from now?", "Big or small.", ""],
  ["What got in the way", "What got in the way last time you tried?", "Time, energy, other people, yourself.", ""],
  ["Practice", "What do you practise without being asked?", "The things you return to.", ""],
  ["Feedback", "Who do you show your work to?", "Or who would you like to?", ""],
  ["Health", "How is your body feeling these days?", "Sleep, movement, food.", ""],
  ["Mindset", "What do you tell yourself when things get hard?", "The voice in your head.", ""],
  ["Time", "Where does your time go that you wish it didn’t?", "Be honest, not harsh.", ""],
  ["Projects", "What would you build if nobody was watching?", "Anything at all.", ""],
] as const;

const SUGGESTED_AREA_NAMES = ["Skills", "Practice", "Projects", "Time", "Feedback", "Health", "Money", "Mindset"];
const RHYTHM_FOR_MINUTES = (minutes: number): GridAction["rhythm"] => (minutes <= 30 ? "daily" : minutes <= 120 ? "weekly" : "monthly");

const studio: GrowthStudioState & { nextAction: number } = {
  areas: structuredClone(AUDIT_AREAS),
  questions: AUDIT_QUESTIONS.map(([topic, prompt, hint, answer], index) => ({ id: `q-${index + 1}`, topic, prompt, hint, answer })),
  lastPausedAreaId: "rest",
  grid: {
    goalId: "g-1",
    goalTitle: "Become a confident developer",
    why: "Build skills and confidence to ship projects on my own.",
    areas: [
      { id: "a-1", name: "Skills", isDraft: false },
      { id: "a-2", name: "Practice", isDraft: false },
      { id: "a-3", name: "Projects", isDraft: false },
      { id: "a-4", name: "Wellbeing", isDraft: false },
      { id: "a-5", name: "Feedback", isDraft: true },
      { id: "a-6", name: "Time", isDraft: true },
      { id: "a-7", name: "Money", isDraft: true },
      { id: "a-8", name: "Mindset", isDraft: true },
    ],
    actions: [
      { id: "ga-1", areaId: "a-1", title: "Review JS closures", minutes: 25, addAs: "task", rhythm: "weekly", status: "draft", rhythmChangedByYou: false },
      { id: "ga-2", areaId: "a-1", title: "Read 10 pages", minutes: 20, addAs: "habit", rhythm: "daily", status: "draft", rhythmChangedByYou: false },
      { id: "ga-3", areaId: "a-2", title: "Code for 20 minutes", minutes: 20, addAs: "habit", rhythm: "daily", status: "draft", rhythmChangedByYou: false },
      { id: "ga-4", areaId: "a-3", title: "Build one small feature", minutes: 120, addAs: "task", rhythm: "weekly", status: "draft", rhythmChangedByYou: false },
      { id: "ga-5", areaId: "a-4", title: "Walk for 20 minutes", minutes: 20, addAs: "task", rhythm: "daily", status: "draft", rhythmChangedByYou: false },
      { id: "ga-6", areaId: "a-4", title: "Water before coffee", minutes: 2, addAs: "habit", rhythm: "daily", status: "suggestion", rhythmChangedByYou: false },
    ],
  },
  suggestedAreas: [],
  reviewOpensInDays: 9,
  nextAction: 100,
};

function suggestFromAnswers(): GrowthStudioState["suggestedAreas"] {
  const quoteFor = (topic: string) => studio.questions.find((question) => question.topic.toLowerCase().includes(topic.toLowerCase()) && question.answer.trim())?.answer.trim() ?? null;
  const daily = studio.questions.find((question) => question.topic === "Daily habits")?.answer ?? "";
  return SUGGESTED_AREA_NAMES.map((name) => {
    let quote = quoteFor(name);
    if (!quote && name === "Time" && /evening|scroll|disappear/i.test(daily)) quote = "Evenings disappear.";
    if (!quote && name === "Practice" && /only study|when something is due/i.test(daily)) quote = "I only study when something is due.";
    return { name, quote: quote ? (quote.length > 60 ? `${quote.slice(0, 57)}…` : quote) : null };
  });
}

function studioView(): GrowthStudioState {
  return structuredClone({ ...studio, suggestedAreas: suggestFromAnswers(), nextAction: undefined }) as GrowthStudioState;
}

export async function getGrowthStudio(): Promise<GrowthStudioState> {
  return delay(studioView());
}

/** Ratings are 1–5 or skipped; notes stay private. There is never an overall score. */
export async function rateArea(areaId: string, rating: number | null, note: string): Promise<GrowthStudioState> {
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) throw new Error("Pick 1 to 5.");
  studio.areas = studio.areas.map((area) => (area.id === areaId ? { ...area, rating, note: note.trim().slice(0, 280) } : area));
  const next = studio.areas.find((area) => area.rating === null && area.id !== areaId);
  studio.lastPausedAreaId = next?.id ?? null;
  return delay(studioView());
}

export async function saveAuditAreas(areas: { id: string | null; name: string }[]): Promise<GrowthStudioState> {
  const cleaned = areas.map((area) => ({ ...area, name: area.name.trim().slice(0, 40) })).filter((area) => area.name.length >= 2).slice(0, 12);
  if (cleaned.length === 0) throw new Error("Keep at least one area.");
  studio.areas = cleaned.map((area) => {
    const existing = area.id ? studio.areas.find((item) => item.id === area.id) : undefined;
    return existing ? { ...existing, name: area.name } : { id: `area-${studio.nextAction++}`, name: area.name, icon: "spark", rating: null, note: "" };
  });
  return delay(studioView());
}

export async function answerQuestion(questionId: string, answer: string): Promise<GrowthStudioState> {
  studio.questions = studio.questions.map((question) => (question.id === questionId ? { ...question, answer: answer.trim().slice(0, 2000) } : question));
  return delay(studioView());
}

/** Point the grid at a goal. A new goal is created through the same goals store, never copied. */
export async function setCentralGoal(input: { goalId: string | null; newTitle?: string; why: string }): Promise<GrowthStudioState> {
  const found = input.goalId ? goals.find((item) => item.id === input.goalId) : undefined;
  let goal: GoalDetail;
  if (found) goal = found;
  else {
    if (!input.newTitle) throw new Error("Pick a goal or name a new one.");
    goal = await createGoal({ title: input.newTitle, why: input.why });
  }
  const why = input.why.trim().slice(0, 280);
  goals = goals.map((item) => (item.id === goal.id ? { ...item, why: why || item.why } : item));
  if (studio.grid && studio.grid.goalId === goal.id) {
    studio.grid = { ...studio.grid, why };
  } else {
    studio.grid = { goalId: goal.id, goalTitle: goal.title, why, areas: [], actions: [] };
  }
  return delay(studioView());
}

export async function applySuggestedGrid(blank: boolean): Promise<GrowthStudioState> {
  if (!studio.grid) throw new Error("Choose a central goal first.");
  const names = blank ? SUGGESTED_AREA_NAMES.map((_, index) => `Area ${index + 1}`) : SUGGESTED_AREA_NAMES;
  studio.grid = {
    ...studio.grid,
    areas: names.map((name, index) => ({ id: `a-${studio.nextAction++}-${index}`, name, isDraft: true })),
    actions: studio.grid.actions.filter((action) => action.status === "accepted"),
  };
  return delay(studioView());
}

export async function renameGridArea(areaId: string, name: string): Promise<GrowthStudioState> {
  const clean = name.trim().slice(0, 30);
  if (clean.length < 2) throw new Error("Area names need at least 2 characters.");
  if (!studio.grid) throw new Error("No grid yet.");
  studio.grid = { ...studio.grid, areas: studio.grid.areas.map((area) => (area.id === areaId ? { ...area, name: clean, isDraft: false } : area)) };
  return delay(studioView());
}

export async function saveGridAction(input: Omit<GridAction, "id" | "status" | "rhythmChangedByYou"> & { id: string | null }): Promise<{ state: GrowthStudioState; actionId: string }> {
  const grid = studio.grid;
  if (!grid) throw new Error("No grid yet.");
  const title = input.title.trim().slice(0, 80);
  if (title.length < 2) throw new Error("Give the action a short name.");
  if (!Number.isInteger(input.minutes) || input.minutes < 1 || input.minutes > 600) throw new Error("Duration is 1 to 600 minutes.");
  const existing = input.id ? grid.actions.find((action) => action.id === input.id) : undefined;
  if (existing?.status === "accepted") throw new Error("This one is already in your plan. Change it there.");
  if (!existing && grid.actions.filter((action) => action.areaId === input.areaId).length >= 8) throw new Error("An area holds up to 8 actions.");
  const id = existing?.id ?? `ga-${studio.nextAction++}`;
  const action: GridAction = {
    id,
    areaId: input.areaId,
    title,
    minutes: input.minutes,
    addAs: input.addAs,
    rhythm: input.rhythm,
    status: "draft",
    rhythmChangedByYou: existing ? existing.rhythm !== input.rhythm || existing.rhythmChangedByYou : false,
  };
  studio.grid = {
    ...grid,
    areas: grid.areas.map((area) => (area.id === input.areaId ? { ...area, isDraft: false } : area)),
    actions: existing ? grid.actions.map((item) => (item.id === id ? action : item)) : [...grid.actions, action],
  };
  return delay({ state: studioView(), actionId: id });
}

export async function setActionRhythm(actionId: string, rhythm: GridAction["rhythm"]): Promise<GrowthStudioState> {
  if (!studio.grid) throw new Error("No grid yet.");
  studio.grid = {
    ...studio.grid,
    actions: studio.grid.actions.map((action) =>
      action.id === actionId && action.status !== "accepted"
        ? { ...action, rhythm, addAs: rhythm === "daily" && action.minutes <= 30 ? "habit" : "task", rhythmChangedByYou: rhythm !== RHYTHM_FOR_MINUTES(action.minutes) }
        : action,
    ),
  };
  return delay(studioView());
}

/**
 * Accept a draft into the real plan, once: a task goes to Planner (linked to the
 * goal), a habit to Habit Tracker. Accepting twice never duplicates it.
 */
export async function acceptGridAction(actionId: string, as: "task" | "habit", habit?: AcceptHabitOptions): Promise<GrowthStudioState> {
  const grid = studio.grid;
  const action = grid?.actions.find((item) => item.id === actionId);
  if (!grid || !action) throw new Error("That action isn’t in your grid any more.");
  if (action.status === "accepted") return delay(studioView());
  const goal = goals.find((item) => item.id === grid.goalId);
  if (as === "habit") {
    const days = habit?.days.filter((day) => day >= 0 && day <= 6) ?? [0, 1, 2, 3, 4, 5, 6];
    if (days.length === 0) throw new Error("Pick at least one day.");
    if (habit?.reminderTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(habit.reminderTime)) throw new Error("Reminder time looks off.");
    await addHabit({
      name: action.title,
      targetCount: 1,
      kind: "timer",
      detail: `${habit?.targetMinutes ?? action.minutes} min`,
      scheduleDays: days,
      reminderTime: habit?.reminderTime ?? null,
      goalName: goal?.title ?? null,
      startsTomorrow: false,
    });
  } else {
    const area = grid.areas.find((item) => item.id === action.areaId);
    await addGoalTask(grid.goalId, { title: action.title, when: action.rhythm === "daily" || action.rhythm === "once" ? "today" : "tomorrow", priority: "medium" }).catch(() =>
      addTask({ title: action.title, when: "today", durationMinutes: action.minutes, category: area?.name, goalName: goal?.title }),
    );
  }
  studio.grid = { ...grid, actions: grid.actions.map((item) => (item.id === actionId ? { ...item, status: "accepted", addAs: as } : item)) };
  return delay(studioView());
}

export async function acceptAllRhythms(): Promise<GrowthStudioState> {
  const pending = studio.grid?.actions.filter((action) => action.status !== "accepted") ?? [];
  for (const action of pending) {
    await acceptGridAction(action.id, action.rhythm === "daily" && action.addAs === "habit" ? "habit" : "task");
  }
  return delay(studioView());
}
