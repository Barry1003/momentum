import { describe, expect, it } from "vitest";
import { hashCode, newCode, sameHash } from "./codes";
import { confirmCodeSchema, deletionSchema, emailChangeSchema } from "./validation";

describe("account codes", () => {
  it("makes six-digit codes", () => {
    for (let i = 0; i < 50; i++) expect(/^\d{6}$/.test(newCode())).toBe(true);
  });
  it("hashes per person and request", () => {
    const a = hashCode("123456", "user-a", "req-1");
    expect(sameHash(a, hashCode("123456", "user-a", "req-1"))).toBe(true);
    expect(sameHash(a, hashCode("123456", "user-b", "req-1"))).toBe(false);
    expect(sameHash(a, hashCode("123456", "user-a", "req-2"))).toBe(false);
    expect(sameHash(a, hashCode("654321", "user-a", "req-1"))).toBe(false);
  });
});

describe("account validation", () => {
  it("normalises email and rejects junk", () => {
    expect(emailChangeSchema.parse({ newEmail: "  Ari@Example.com " }).newEmail).toBe("ari@example.com");
    expect(emailChangeSchema.safeParse({ newEmail: "not-an-email" }).success).toBe(false);
    expect(emailChangeSchema.safeParse({ newEmail: "a@b.co", userId: "x" }).success).toBe(false);
  });
  it("needs a 6-digit code and DELETE in capitals", () => {
    expect(confirmCodeSchema.safeParse({ code: "12345" }).success).toBe(false);
    expect(deletionSchema.safeParse({ code: "123456", confirmWord: "DELETE" }).success).toBe(true);
    expect(deletionSchema.safeParse({ code: "123456", confirmWord: "delete" }).success).toBe(false);
  });
});
