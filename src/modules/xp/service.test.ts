import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ getPrisma: () => { throw new Error("not used"); } }));
import { appendXp } from "./service";

type Item = { userId: string; idempotencyKey: string; amount: number; source: string; sourceId: string };
function fixture(actor = "alice", initialStage = "CHILD") {
  const entries: Item[] = [];
  const events: string[] = [];
  const avatar = { stage: initialStage, totalXp: 0 };
  const tx = {
    $queryRaw: async (_strings: TemplateStringsArray, ...params: unknown[]) =>
      params[0] === actor ? [{ id: "avatar" }] : [],
    xpEvent: {
      findUnique: async ({ where }: { where: { userId_idempotencyKey: { userId: string; idempotencyKey: string } } }) => {
        const { userId, idempotencyKey } = where.userId_idempotencyKey;
        return entries.find(e => e.userId === userId && e.idempotencyKey === idempotencyKey) ?? null;
      },
      create: async ({ data }: { data: Item }) => { entries.push(data); return data; },
      aggregate: async ({ where }: { where: { userId: string } }) => ({
        _sum: { amount: entries.filter(e => e.userId === where.userId).reduce((sum, e) => sum + e.amount, 0) },
      }),
    },
    avatar: {
      findUniqueOrThrow: async () => avatar,
      update: async ({ data }: { data: { totalXp: number; stage: string } }) => Object.assign(avatar, data),
    },
    growthEvent: { create: async ({ data }: { data: { stage: string } }) => {
      events.push(data.stage);
    } },
  };
  return { tx: tx as unknown as Parameters<typeof appendXp>[0], entries, events, avatar };
}
describe("append-only rewards", () => {
  it("awards only once for one source id and rejects an altered retry", async () => {
    const { tx, entries, avatar } = fixture();
    const reward = { source: "TASK" as const, sourceId: "completed-1", key: "task:completed-1:award", amount: 10 };
    expect((await appendXp(tx, "alice", reward)).xpAwarded).toBe(10);
    expect((await appendXp(tx, "alice", reward)).xpAwarded).toBe(0);
    expect(entries).toHaveLength(1);
    expect(avatar.totalXp).toBe(10);
    await expect(appendXp(tx, "alice", { ...reward, amount: 99 })).rejects.toMatchObject({ code: "XP_EVENT_CONFLICT" });
  });
  it("keeps permanent stage after a compensating negative ledger entry", async () => {
    const { tx, entries, events, avatar } = fixture();
    await appendXp(tx, "alice", { source: "TASK", sourceId: "one", key: "one", amount: 900 });
    expect(avatar.stage).toBe("TEEN");
    expect(events).toEqual(["PRETEEN", "TEEN"]);
    await appendXp(tx, "alice", { source: "TASK", sourceId: "one", key: "undo-one", amount: -900 });
    expect(entries.map(e => e.amount)).toEqual([900, -900]);
    expect(avatar.totalXp).toBe(0);
    expect(avatar.stage).toBe("TEEN");
    expect(events).toHaveLength(2);
  });
  it("fails without the actor's own avatar lock", async () => {
    const { tx, entries } = fixture("alice");
    await expect(appendXp(tx, "bob", { source: "TASK", sourceId: "x", key: "x", amount: 10 }))
      .rejects.toMatchObject({ code: "AVATAR_REQUIRED" });
    expect(entries).toHaveLength(0);
  });
});
