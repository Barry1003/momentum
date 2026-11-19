import { apiError, requiredUser, result } from "@/modules/squads/http";
import { getPrisma } from "@/db/client";

export const runtime = "nodejs";

/** A user-scoped read model for Home, Planner and Habits. No demo data. */
export async function GET() {
  try {
    const user = await requiredUser();
    const db = getPrisma();
    const [tasks, goals, habits, habitLogs, avatar, squads] = await Promise.all([
      db.task.findMany({
        where: { archivedAt: null, OR: [
          { ownerId: user.id, squadId: null },
          { ownerId: user.id, squad: { is: { members: { some: { userId: user.id, status: "ACTIVE" } } } } },
          { visibility: "SQUAD", squad: { is: { members: { some: { userId: user.id, status: "ACTIVE" } } } } },
        ] },
        include: { completions: { orderBy: { occurrenceDate: "desc" }, take: 90 }, goal: { select: { title: true, area: true } }, squad: { select: { name: true } } },
        orderBy: { createdAt: "desc" }, take: 100,
      }),
      db.goal.findMany({
        where: { archivedAt: null, OR: [
          { ownerId: user.id, squadId: null },
          { squadId: { not: null }, members: { some: { userId: user.id } },
            squad: { is: { members: { some: { userId: user.id, status: "ACTIVE" } } } } },
        ] },
        include: { tasks: { select: { id: true, completions: { select: { id: true }, take: 1 } } } },
        orderBy: { createdAt: "desc" }, take: 50,
      }),
      db.habit.findMany({ where: { ownerId: user.id, archivedAt: null }, orderBy: { createdAt: "desc" }, take: 100 }),
      db.habitLog.findMany({ where: { userId: user.id, date: { gte: new Date(Date.now() - 120 * 86400000) } },
        select: { habitId: true, date: true, value: true }, orderBy: { date: "desc" }, take: 2000 }),
      db.avatar.findUnique({ where: { userId: user.id }, select: { stage: true, totalXp: true } }),
      db.squadMember.findMany({ where: { userId: user.id, status: "ACTIVE", squad: { status: "ACTIVE" } },
        select: { squadId: true, squad: { select: { name: true } } }, take: 10 }),
    ]);
    return result({ tasks, goals, habits, habitLogs, avatar, squads });
  } catch (error) {
    return apiError(error);
  }
}
