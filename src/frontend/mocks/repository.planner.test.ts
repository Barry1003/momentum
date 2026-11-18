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
