import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { sendCodeEmail } from "./email";

const oldKey = process.env.RESEND_API_KEY;
const oldFrom = process.env.AUTH_EMAIL_FROM;
const originalFetch = globalThis.fetch;

beforeEach(() => {
  process.env.RESEND_API_KEY = "test_only_key";
  process.env.AUTH_EMAIL_FROM = "Momentum <auth@example.com>";
});
afterEach(() => {
  if (oldKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = oldKey;
  if (oldFrom === undefined) delete process.env.AUTH_EMAIL_FROM;
  else process.env.AUTH_EMAIL_FROM = oldFrom;
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("OTP email delivery", () => {
  it("rejects missing email service configuration without revealing secrets", async () => {
    delete process.env.RESEND_API_KEY;
    await expect(sendCodeEmail({ to: "user@example.com", code: "123456", type: "email-verification" }))
      .rejects.toThrow("Email provider is not configured");
  });
  it("sends the correct OTP type through Resend once", async () => {
    const spy = vi.fn(async (_url: string, _init?: RequestInit) => {
      void _url; void _init;
      return { ok: true, status: 200 } as Response;
    });
    globalThis.fetch = spy as typeof fetch;
    await sendCodeEmail({ to: "user@example.com", code: "123456", type: "email-verification" });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]?.[0]).toBe("https://api.resend.com/emails");
    const init = spy.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(init.body as string) as { subject: string; text: string };
    expect(body.subject).toBe("Verify your Momentum account");
    expect(body.text).toContain("123456");
  });
  it("reports status codes but never the provider response or OTP", async () => {
    const spy = vi.fn(async (_url: string, _init?: RequestInit) => {
      void _url; void _init;
      return { ok: false, status: 403,
        text: async () => "Sensitive provider error with recipient details" } as Response;
    });
    globalThis.fetch = spy as typeof fetch;
    await expect(sendCodeEmail({ to: "user@example.com", code: "123456", type: "email-verification" }))
      .rejects.toThrow("Email delivery failed (HTTP 403)");
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
