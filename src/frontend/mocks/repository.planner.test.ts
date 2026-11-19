import { describe, expect, it } from "vitest";
import { addTask, completeTask, getPlanner, getToday, moveCarryOverToToday, undoCompleteTask } from "./repository";

describe("planner mock repository", () => {
  it("awards XP once and takes back exactly that much on undo", async () => {
    const { tasks, companion } = await getToday();
    const open = tasks.find((task) => !task.isDone)!;
    const done = await completeTask(open.id);
    expect(done.xpAwarded).toBeGreaterThan(0);
    expect(done.companion.xp).toBe(companion.xp + done.xpAwarded);

    const again = await completeTask(open.id);
    expect(again.xpAwarded).toBe(0);

    const undone = await undoCompleteTask(open.id);
    expect(undone.task.isDone).toBe(false);
    expect(undone.companion.xp).toBe(companion.xp);
  });

  it("keeps new tasks private unless sharing is chosen", async () => {
    const { task } = await addTask({ title: "Practice TypeScript generics", when: "today" });
    expect(task.isShared).toBe(false);
    const shared = await addTask({ title: "Prep the demo", when: "today", shareWithSquad: true });
    expect(shared.task.isShared).toBe(true);
  });

  it("files tasks for later days on the full list, not today", async () => {
    const before = (await getToday()).tasks.length;
    await addTask({ title: "Plan Friday", when: "tomorrow" });
    expect((await getToday()).tasks.length).toBe(before);
    expect((await getPlanner()).allTasks.some((task) => task.title === "Plan Friday")).toBe(true);
  });

  it("moves yesterday's leftover into today once", async () => {
    const { task, planner } = await moveCarryOverToToday();
    expect(task?.title).toBe("Draft portfolio intro");
    expect(planner.carryOver).toBeNull();
    expect((await getToday()).tasks.some((item) => item.id === task?.id)).toBe(true);
  });
});

describe("focus sessions", () => {
  it("awards focus XP once per session, on the server side", async () => {
    const { quoteFocusXp, saveFocusSession } = await import("./repository");
    expect(await quoteFocusXp(14 * 60 + 8)).toBe(3);
    expect(await quoteFocusXp(30)).toBe(0);
    const first = await saveFocusSession("s-1", { taskId: null, focusedSeconds: 1500, plannedMinutes: 25, mode: "solo" });
    expect(first.xpAwarded).toBe(5);
    const retry = await saveFocusSession("s-1", { taskId: null, focusedSeconds: 1500, plannedMinutes: 25, mode: "solo" });
    expect(retry.xpAwarded).toBe(0);
    const capped = await saveFocusSession("s-2", { taskId: null, focusedSeconds: 99_999, plannedMinutes: 25, mode: "solo" });
    expect(capped.focusedSeconds).toBe(1500);
  });
});

describe("habits", () => {
  it("earns a consistency moment once, when the run reaches a milestone", async () => {
    const { getHabitTracker, incrementHabit } = await import("./repository");
    const tracker = await getHabitTracker();
    expect(tracker.rhythms["habit-3"]).toBe(12);
    const water = tracker.habits.find((habit) => habit.id === "habit-1")!;
    let moment = null;
    for (let i = water.completedCount; i < water.targetCount; i += 1) {
      moment = (await incrementHabit("habit-1")).moment;
    }
    expect(moment?.days).toBe(14);
    expect(moment?.xpAwarded).toBe(30);
    const extra = await incrementHabit("habit-1");
    expect(extra.moment).toBeNull();
  });

  it("gives no XP for logging past the target", async () => {
    const { incrementHabit } = await import("./repository");
    const first = await incrementHabit("habit-3");
    const again = await incrementHabit("habit-3");
    expect(again.companion.xp).toBe(first.companion.xp);
  });

  it("pauses from tomorrow and resumes", async () => {
    const { pauseHabit, resumeHabit } = await import("./repository");
    const paused = await pauseHabit("habit-4", 1);
    expect(paused.isScheduledToday).toBe(true);
    expect(paused.pausedFrom).not.toBeNull();
    const resumed = await resumeHabit("habit-4");
    expect(resumed.pausedFrom).toBeNull();
  });
});

describe("goals", () => {
  it("finishes a linked task once, on both the goal and today's list", async () => {
    const { completeGoalTask, getGoal, getToday } = await import("./repository");
    const before = (await getGoal("g-1"))!;
    const first = await completeGoalTask("g-1", "gt-3");
    expect(first.xpAwarded).toBe(10);
    expect(first.goal.doneCount).toBe(before.doneCount + 1);
    expect((await completeGoalTask("g-1", "gt-3")).xpAwarded).toBe(0);
    expect((await getToday()).tasks.length).toBeGreaterThan(0);
  });

  it("never lets you finish someone else's or a private task on a shared goal", async () => {
    const { completeGoalTask } = await import("./repository");
    expect((await completeGoalTask("g-2", "gt-6")).xpAwarded).toBe(0);
  });

  it("awards a milestone once and the goal when the last one is reached", async () => {
    const { confirmMilestone, getGoal } = await import("./repository");
    const third = await confirmMilestone("g-1", "m-3");
    expect(third.xpAwarded).toBe(60);
    expect(third.goalReachedXp).toBeNull();
    expect((await confirmMilestone("g-1", "m-3")).xpAwarded).toBe(0);
    const last = await confirmMilestone("g-1", "m-4");
    expect(last.goalReachedXp).toBe(200);
    expect((await getGoal("g-1"))?.completedOn).not.toBeNull();
  });

  it("links a task added from a goal and counts it", async () => {
    const { addGoalTask, createGoal } = await import("./repository");
    const fresh = await createGoal({ title: "Learn to cook" });
    expect(fresh.totalCount).toBe(0);
    const next = await addGoalTask(fresh.id, { title: "Cook pasta", when: "today", priority: "medium" });
    expect(next.totalCount).toBe(1);
    expect(next.tasks[0].todayTaskId).toBeDefined();
  });
});

describe("progress and check-ins", () => {
  it("never counts the future and keeps ranges ordered", async () => {
    const { getProgress } = await import("./repository");
    const summary = await getProgress("2999-01-01", "2026-01-01");
    expect(summary.from <= summary.to).toBe(true);
    expect(summary.to <= new Date().toISOString().slice(0, 10)).toBe(true);
  });

  it("awards check-in XP once a day", async () => {
    const { saveCheckIn, getCheckInStatus } = await import("./repository");
    const input = { mood: "good" as const, effort: "steady" as const, win: "Closures", obstacle: "", shareCheckedIn: true };
    expect((await saveCheckIn(input)).xpAwarded).toBe(10);
    expect((await saveCheckIn(input)).xpAwarded).toBe(0);
    expect((await getCheckInStatus()).doneToday).toBe(true);
  });

  it("celebrates a new stage once and never takes it back", async () => {
    const { getPendingStageUp, acknowledgeStageUp, saveFocusSession, undoCompleteTask, completeTask, getToday } = await import("./repository");
    for (let i = 0; i < 70 && !(await getPendingStageUp()); i += 1) {
      await saveFocusSession(`grow-${i}`, { taskId: null, focusedSeconds: 3600, plannedMinutes: 60, mode: "solo" });
    }
    const event = await getPendingStageUp();
    expect(event?.stage).toBe("youngAdult");
    await acknowledgeStageUp();
    expect(await getPendingStageUp()).toBeNull();
    const open = (await getToday()).tasks.find((task) => !task.isDone);
    if (open) {
      await completeTask(open.id);
      const undone = await undoCompleteTask(open.id);
      expect(undone.companion.stage).toBe("youngAdult");
    }
  });
});

describe("achievements and studio", () => {
  it("keeps achievements private until shared", async () => {
    const { getAchievement, setAchievementShared } = await import("./repository");
    expect((await getAchievement("deep-diver"))?.isShared).toBe(false);
    expect((await setAchievementShared("deep-diver", true))?.isShared).toBe(true);
    expect((await setAchievementShared("bookworm", true))?.isShared).toBe(false);
  });

  it("only applies looks the person has", async () => {
    const { saveLook } = await import("./repository");
    const studio = await saveLook({ room: "midnight", plinth: "mint", name: "Ari" });
    expect(studio.room).not.toBe("midnight");
    expect(studio.plinth).toBe("mint");
    const sage = await saveLook({ room: "sage" });
    expect(sage.room).toBe("sage");
  });
});

describe("settings and account", () => {
  it("validates handles and quiet hours", async () => {
    const { saveProfileDetails, saveQuietHours } = await import("./repository");
    await expect(saveProfileDetails({ handle: "@zara", intention: "" })).rejects.toThrow();
    await expect(saveProfileDetails({ handle: "a b", intention: "" })).rejects.toThrow();
    expect((await saveProfileDetails({ handle: "@Ari_Builds", intention: "x" })).handle).toBe("ari_builds");
    await expect(saveQuietHours({ enabled: true, from: "22:00", to: "22:00", days: "everyDay", customDays: [] })).rejects.toThrow();
  });

  it("needs the code, the word and no solo squad to schedule deletion", async () => {
    const { requestAccountDeletion, previewTransferOwnership } = await import("./repository");
    await expect(requestAccountDeletion("482913", "DELETE")).rejects.toThrow();
    await previewTransferOwnership();
    await expect(requestAccountDeletion("000000", "DELETE")).rejects.toThrow();
    await expect(requestAccountDeletion("482913", "delete")).rejects.toThrow();
    expect((await requestAccountDeletion("482913", "DELETE")).deletionScheduledFor).not.toBeNull();
  });
});

describe("growth studio", () => {
  it("keeps ratings 1–5 and moves on to the next area", async () => {
    const { rateArea } = await import("./repository");
    await expect(rateArea("health", 7, "")).rejects.toThrow();
    const state = await rateArea("health", 3, "  ok  ");
    expect(state.areas.find((area) => area.id === "health")?.note).toBe("ok");
    expect(state.lastPausedAreaId).toBe("money");
  });

  it("accepts a draft into the plan once, never twice", async () => {
    const { acceptGridAction, getHabits } = await import("./repository");
    const before = (await getHabits()).habits.length;
    await acceptGridAction("ga-3", "habit", { days: [0, 1, 2, 3, 4, 5, 6], targetMinutes: 20, reminderTime: null });
    const again = await acceptGridAction("ga-3", "habit", { days: [0, 1, 2, 3, 4, 5, 6], targetMinutes: 20, reminderTime: null });
    expect((await getHabits()).habits.length).toBe(before + 1);
    expect(again.grid?.actions.find((action) => action.id === "ga-3")?.status).toBe("accepted");
  });

  it("limits an area to 8 actions", async () => {
    const { saveGridAction } = await import("./repository");
    for (let i = 0; i < 8; i += 1) {
      await saveGridAction({ id: null, areaId: "a-8", title: `Step ${i}`, minutes: 10, addAs: "task", rhythm: "weekly" }).catch(() => undefined);
    }
    await expect(saveGridAction({ id: null, areaId: "a-8", title: "One more", minutes: 10, addAs: "task", rhythm: "weekly" })).rejects.toThrow();
  });
});
