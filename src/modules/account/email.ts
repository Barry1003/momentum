import "server-only";

/** Sends a short code email through the same provider as sign-in. Never logs addresses or codes. */
export async function sendAccountCode(message: { to: string; code: string; purpose: "email-change" | "delete-account" }): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Email provider is not configured");
  const subject = message.purpose === "email-change" ? "Confirm your new Momentum email" : "Confirm deleting your Momentum account";
  const action = message.purpose === "email-change" ? "change the email on your Momentum account" : "delete your Momentum account (it is removed after 14 days and you can cancel until then)";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: [message.to], subject,
      text: `Your code to ${action} is ${message.code}. It expires in 10 minutes. If you didn't ask for this, ignore this email and your account stays as it is.`,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Email delivery failed (HTTP ${response.status})`);
}

/** Lets the old address know the account email changed. */
export async function sendEmailChangedNotice(to: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.AUTH_EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Email provider is not configured");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from, to: [to], subject: "Your Momentum email was changed",
      text: "The email on your Momentum account was just changed. If this wasn't you, reply to this email or contact support straight away.",
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Email delivery failed (HTTP ${response.status})`);
}
