import "server-only";
import nodemailer from "nodemailer";

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("Email provider is not configured");
  if (!transport) {
    transport = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  }
  return transport;
}

export async function sendMail(message: { to: string; subject: string; text: string }): Promise<void> {
  const from = process.env.AUTH_EMAIL_FROM;
  if (!from) throw new Error("Email provider is not configured");
  const transport = getTransport();
  try {
    await transport.sendMail({ from, to: message.to, subject: message.subject, text: message.text });
  } catch {
    // Never put response bodies, recipient addresses, or tokens in logs.
    throw new Error("Email delivery failed");
  }
}
