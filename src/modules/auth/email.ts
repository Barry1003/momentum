import "server-only";

type Message = { to: string; subject: string; url: string; action: "verify" | "reset" };

export async function sendAuthenticationEmail(message: Message): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("Email provider is not configured");
  }
  const label = message.action === "verify" ? "Verify your email" : "Reset your password";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [message.to],
      subject: message.subject,
      text: `${label} for Momentum. Open this one-time link: ${message.url}\n\nIf you did not request this, ignore this email.`,
    }),
    cache: "no-store",
  });
  if (!response.ok) {
    // Never put response bodies, recipient addresses, reset links, or tokens in logs.
    throw new Error(`Email delivery failed (HTTP ${response.status})`);
  }
}

export async function sendCodeEmail(message: {
  to: string;
  code: string;
  type: "email-verification" | "sign-in" | "forget-password" | "change-email";
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Email provider is not configured");
  const subject = message.type === "email-verification"
    ? "Verify your Momentum account"
    : message.type === "sign-in" ? "Your Momentum sign-in code" : message.type === "change-email" ? "Confirm your Momentum email change" : "Your Momentum recovery code";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: [message.to], subject,
      text: `Your Momentum verification code is ${message.code}. It expires in 10 minutes. If you did not request this, ignore the email.`,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Email delivery failed (HTTP ${response.status})`);
}
