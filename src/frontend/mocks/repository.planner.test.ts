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
