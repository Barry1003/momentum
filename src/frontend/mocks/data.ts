import type { CompanionState, Habit, SquadMember, Task } from "./types";

export const mockCompanion: CompanionState = {
  stage: "teen",
  xp: 420,
  xpToNextStage: 600,
};

export const mockTasks: Task[] = [
  { id: "task-1", title: "Stretch for 5 minutes", isDone: false, time: "8:00 AM", isShared: false },
  { id: "task-2", title: "Reply to Zara's message", isDone: false, time: "11:00 AM", isShared: true, sharedByName: "Zara" },
  { id: "task-3", title: "Plan tomorrow's focus block", isDone: true, time: "2:00 PM", isShared: false },
];

export const mockHabits: Habit[] = [
  { id: "habit-1", name: "Drink water", targetCount: 8, completedCount: 3, isScheduledToday: true },
  { id: "habit-2", name: "Evening walk", targetCount: 1, completedCount: 0, isScheduledToday: true },
  { id: "habit-3", name: "Read", targetCount: 1, completedCount: 1, isScheduledToday: false },
];

export const mockSquadMembers: SquadMember[] = [
  { id: "member-1", name: "Zara", avatarInitial: "Z", isCheckedInToday: true, isFocusing: false, stage: "adult" },
  { id: "member-2", name: "Malik", avatarInitial: "M", isCheckedInToday: false, isFocusing: true, stage: "youngAdult" },
  { id: "member-3", name: "Kemi", avatarInitial: "K", isCheckedInToday: true, isFocusing: false, stage: "teen" },
  { id: "member-4", name: "Dayo", avatarInitial: "D", isCheckedInToday: false, isFocusing: false, stage: "preteen" },
];
