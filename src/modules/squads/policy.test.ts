import { describe, expect, it } from "vitest";
import { canManageMember, canManageSquad, mayJoin, mayLeave } from "./policy";
import { createSquadSchema, invitationSchema, updateSquadSchema } from "./validation";

describe("squad authorization", () => {
  it("permits only owners and admins to manage the squad", () => {
    expect(canManageSquad("OWNER")).toBe(true);
    expect(canManageSquad("ADMIN")).toBe(true);
    expect(canManageSquad("MEMBER")).toBe(false);
  });
  it("protects owners and blocks admin-on-admin actions", () => {
    expect(canManageMember("ADMIN", "MEMBER")).toBe(true);
    expect(canManageMember("ADMIN", "ADMIN")).toBe(false);
    expect(canManageMember("OWNER", "OWNER")).toBe(false);
    expect(canManageMember("OWNER", "ADMIN")).toBe(true);
    expect(mayLeave("OWNER")).toBe(false);
    expect(mayLeave("MEMBER")).toBe(true);
  });
  it("enforces invite usage and squad capacity", () => {
    expect(mayJoin(0, 1, 9, 10)).toBeNull();
    expect(mayJoin(1, 1, 2, 10)).toBe("INVITATION_EXHAUSTED");
    expect(mayJoin(0, 1, 10, 10)).toBe("SQUAD_FULL");
  });
});
describe("squad input validation", () => {
  it("requires a valid squad name and max capacity", () => {
    expect(createSquadSchema.safeParse({ name: "Study", maxMembers: 10 }).success).toBe(true);
    expect(createSquadSchema.safeParse({ name: "x", maxMembers: 11 }).success).toBe(false);
    expect(createSquadSchema.safeParse({ name: "Study", ownerId: "forged" }).success).toBe(false);
  });
  it("disallows empty updates, invalid invites and extra fields", () => {
    expect(updateSquadSchema.safeParse({}).success).toBe(false);
    expect(invitationSchema.safeParse({ email: "not-email" }).success).toBe(false);
    expect(invitationSchema.safeParse({ expiresHours: 0 }).success).toBe(false);
    expect(invitationSchema.safeParse({ maxUses: 11 }).success).toBe(false);
  });
});
