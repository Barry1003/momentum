import type { CompanionState, FocusLobby, Habit, NotificationItem, PlannerData, SquadMember, Task } from "./types";

export const mockCompanion: CompanionState = {
  stage: "teen",
  xp: 1260,
  xpToNextStage: 1600,
};

export const mockTasks: Task[] = [
  { id: "task-1", title: "Review JS closures", isDone: false, time: "10:00", durationMinutes: 25, category: "Development", goalName: "Confident developer", isShared: false },
  { id: "task-2", title: "Read 10 pages", isDone: true, time: "08:30", durationMinutes: 20, category: "Reading", goalName: "Read consistently", isShared: false },
  { id: "task-3", title: "Walk for 20 minutes", isDone: false, time: "15:00", durationMinutes: 20, category: "Wellness", isShared: true, sharedByName: "Northstar" },
];

export const mockHabits: Habit[] = [
  { id: "habit-1", name: "Drink water", targetCount: 8, completedCount: 2, isScheduledToday: true, icon: "water", unit: "glasses", kind: "target", scheduleDays: [0, 1, 2, 3, 4, 5, 6], shareWithSquad: false },
  { id: "habit-2", name: "Move", targetCount: 1, completedCount: 0, isScheduledToday: true, icon: "move", kind: "tick", detail: "20 min walk or stretch", scheduleDays: [0, 2, 4, 6], goalName: "Everyday wellbeing" },
  { id: "habit-3", name: "Read", targetCount: 1, completedCount: 1, isScheduledToday: true, icon: "read", kind: "tick", detail: "10 pages", scheduleDays: [0, 1, 2, 3, 4, 5, 6], goalName: "Read consistently" },
  { id: "habit-4", name: "Lights out by 23:00", targetCount: 1, completedCount: 0, isScheduledToday: true, icon: "sparkle", kind: "tick", detail: "Tonight", scheduleDays: [0, 1, 2, 3, 4, 5, 6] },
];

export const mockSquadMembers: SquadMember[] = [
  { id: "member-1", name: "Zara", avatarInitial: "Z", isCheckedInToday: true, isFocusing: true, stage: "adult" },
  { id: "member-2", name: "Malik", avatarInitial: "M", isCheckedInToday: true, isFocusing: false, stage: "youngAdult" },
  { id: "member-3", name: "Kemi", avatarInitial: "K", isCheckedInToday: true, isFocusing: false, stage: "teen" },
  { id: "member-4", name: "Dayo", avatarInitial: "D", isCheckedInToday: false, isFocusing: false, stage: "preteen" },
];

export const mockNotifications: NotificationItem[] = [
  { id: "n-1", kind: "cheer", fromName: "Zara", title: "Zara sent you a high five", body: "“For finishing your reading streak!”", when: "2m", group: "today", isRead: false },
  { id: "n-2", kind: "growth", title: "Ari is 340 XP from Young Adult", body: "Two more tasks today gets you closer.", when: "1h", group: "today", isRead: false },
  { id: "n-3", kind: "squad", fromName: "Malik", title: "Malik joined “30 focus hours”", body: "Northstar is at 60% together.", when: "3h", group: "today", isRead: false },
  { id: "n-4", kind: "review", title: "Your 15-day check-in opens soon", body: "2 December · three short questions", when: "Mon", group: "earlier", isRead: true },
  { id: "n-5", kind: "squad", fromName: "Kemi", title: "Kemi finished “Read chapter 3”", body: "A shared task in Northstar", when: "Sun", group: "earlier", isRead: true },
];

export const mockPlanner: PlannerData = {
  carryOver: { id: "carry-1", title: "Draft portfolio intro" },
  suggestedActionCount: 2,
  habitsPerDay: 3,
  weekTaskCounts: [2, 3, 2, 1, 3, 0, 1],
  weekTasks: {
    0: [
      { id: "w-0-1", title: "Plan the week", detail: "09:00 · 15 min", isDone: true, isShared: false },
      { id: "w-0-2", title: "Gym session", detail: "18:00 · Wellbeing", isDone: true, isShared: false },
    ],
    1: [
      { id: "w-1-1", title: "Review JS closures", detail: "09:00 · 25 min", isDone: true, isShared: false },
      { id: "w-1-2", title: "Walk for 20 minutes", detail: "17:30 · Wellbeing", isDone: false, isShared: false },
      { id: "w-1-3", title: "Read chapter 3", detail: "Northstar · shared", isDone: false, isShared: true },
    ],
    2: [
      { id: "w-2-1", title: "Review JS closures", detail: "09:00 · 25 min", isDone: true, isShared: false },
      { id: "w-2-2", title: "Walk for 20 minutes", detail: "17:30 · Wellbeing", isDone: false, isShared: false },
      { id: "w-2-3", title: "Read chapter 3", detail: "Northstar · shared", isDone: false, isShared: true },
    ],
    3: [{ id: "w-3-1", title: "Read chapter 3", detail: "Northstar · shared", isDone: false, isShared: true }],
    4: [
      { id: "w-4-1", title: "Draft portfolio intro", detail: "High priority", isDone: false, isShared: false },
      { id: "w-4-2", title: "Review launch copy", detail: "Northstar · shared", isDone: false, isShared: true },
      { id: "w-4-3", title: "Walk for 20 minutes", detail: "17:30 · Wellbeing", isDone: false, isShared: false },
    ],
    5: [],
    6: [{ id: "w-6-1", title: "Weekly review", detail: "10:00 · 15 min", isDone: false, isShared: false }],
  },
  allTasks: [
    { id: "t-1", title: "Set up workspace", detail: "Was due Fri 13", group: "overdue", isDone: false, isShared: false, hasDate: true, badge: "Move" },
    { id: "t-2", title: "Walk for 20 minutes", detail: "Daily · Wellbeing", group: "thisWeek", isDone: false, isShared: false, hasDate: true },
    { id: "t-3", title: "Read chapter 3", detail: "Thu · Northstar", group: "thisWeek", isDone: false, isShared: true, hasDate: true, badge: "Shared" },
    { id: "t-4", title: "Draft portfolio intro", detail: "Fri · High", group: "thisWeek", isDone: false, isShared: false, hasDate: true, badge: "P1" },
    { id: "t-5", title: "Ask for feedback", detail: "Weekly from 23 Nov", group: "later", isDone: false, isShared: false, hasDate: true },
    { id: "t-6", title: "Sketch a side project", detail: "Someday", group: "later", isDone: false, isShared: false, hasDate: false },
    { id: "t-7", title: "Read 10 pages", detail: "Done today · Reading", group: "thisWeek", isDone: true, isShared: false, hasDate: true },
    { id: "t-8", title: "Plan the week", detail: "Done Mon", group: "thisWeek", isDone: true, isShared: false, hasDate: true },
  ],
  goals: [
    { id: "g-1", title: "Become a confident developer", doneCount: 18, totalCount: 29, detail: "Personal · target 31 Dec", isShared: false, isPaused: false },
    { id: "g-2", title: "Build our launch together", doneCount: 23, totalCount: 34, detail: "Northstar · shared · 30 Dec", isShared: true, isPaused: false },
    { id: "g-3", title: "Run a 5K", doneCount: 3, totalCount: 15, detail: "Personal · no target", isShared: false, isPaused: true },
  ],
  shared: [
    { id: "s-1", title: "Read chapter 3", assignedBy: "Zara", due: "Thu" },
    { id: "s-2", title: "Review launch copy", assignedBy: "Malik", due: "Fri" },
  ],
  squadName: "Northstar",
};

export const mockFocusLobby: FocusLobby = {
  squadName: "Northstar",
  lengthMinutes: 25,
  startsInSeconds: 45,
  members: [
    { id: "lobby-1", name: "Zara", status: "ready", note: "Portfolio case study" },
    { id: "lobby-2", name: "Malik", status: "ready", note: "Math set 4" },
    { id: "lobby-3", name: "Kemi", status: "waiting", note: "Invited" },
  ],
};

/** Focused minutes already logged this week before today's sessions. */
export const mockWeekFocusedMinutes = 165;
