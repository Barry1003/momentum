import type { CompanionState, Habit, NotificationItem, SquadMember, Task } from "./types";

export const mockCompanion: CompanionState = {
  stage: "teen",
  xp: 1260,
  xpToNextStage: 1600,
};

export const mockTasks: Task[] = [
  { id: "task-1", title: "Review JS closures", isDone: false, durationMinutes: 25, category: "Development", isShared: false },
  { id: "task-2", title: "Read 10 pages", isDone: true, durationMinutes: 20, category: "Reading", isShared: false },
  { id: "task-3", title: "Walk for 20 minutes", isDone: false, durationMinutes: 20, category: "Wellness", isShared: true, sharedByName: "Northstar" },
];

export const mockHabits: Habit[] = [
  { id: "habit-1", name: "Drink water", targetCount: 8, completedCount: 2, isScheduledToday: true, icon: "water", unit: "glasses" },
  { id: "habit-2", name: "Move daily", targetCount: 1, completedCount: 0, isScheduledToday: true, icon: "move" },
  { id: "habit-3", name: "Read", targetCount: 1, completedCount: 1, isScheduledToday: true, icon: "read" },
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
