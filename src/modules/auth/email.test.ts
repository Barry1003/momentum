import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

type SendMailArgs = { from: string; to: string; subject: string; text: string };
const { sendMailMock } = vi.hoisted(() => ({ sendMailMock: vi.fn(async (args: SendMailArgs) => { void args; return {}; }) }));
vi.mock("nodemailer", () => ({
  default: { createTransport: vi.fn(() => ({ sendMail: sendMailMock })) },
}));

const { sendCodeEmail } = await import("./email");

const oldUser = process.env.GMAIL_USER;
const oldPass = process.env.GMAIL_APP_PASSWORD;
const oldFrom = process.env.AUTH_EMAIL_FROM;

beforeEach(() => {
  process.env.GMAIL_USER = "test@example.com";
  process.env.GMAIL_APP_PASSWORD = "test_only_app_password";
  process.env.AUTH_EMAIL_FROM = "Momentum <auth@example.com>";
  sendMailMock.mockClear();
});
afterEach(() => {
  if (oldUser === undefined) delete process.env.GMAIL_USER;
  else process.env.GMAIL_USER = oldUser;
  if (oldPass === undefined) delete process.env.GMAIL_APP_PASSWORD;
  else process.env.GMAIL_APP_PASSWORD = oldPass;
  if (oldFrom === undefined) delete process.env.AUTH_EMAIL_FROM;
  else process.env.AUTH_EMAIL_FROM = oldFrom;
  vi.restoreAllMocks();
});

describe("OTP email delivery", () => {
  it("rejects missing email service configuration without revealing secrets", async () => {
    delete process.env.GMAIL_USER;
    await expect(sendCodeEmail({ to: "user@example.com", code: "123456", type: "email-verification" }))
      .rejects.toThrow("Email provider is not configured");
  });
  it("sends the correct OTP type through Gmail SMTP once", async () => {
    sendMailMock.mockResolvedValueOnce({});
    await sendCodeEmail({ to: "user@example.com", code: "123456", type: "email-verification" });
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const call = sendMailMock.mock.calls[0]?.[0];
    expect(call?.subject).toBe("Verify your Momentum account");
    expect(call?.text).toContain("123456");
  });
  it("reports a generic failure but never the provider response or OTP", async () => {
    sendMailMock.mockRejectedValueOnce(new Error("Sensitive provider error with recipient details"));
    await expect(sendCodeEmail({ to: "user@example.com", code: "123456", type: "email-verification" }))
      .rejects.toThrow("Email delivery failed");
    expect(sendMailMock).toHaveBeenCalledTimes(1);
  });
});
