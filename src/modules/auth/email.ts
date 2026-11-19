import "server-only";
import { sendMail } from "@/modules/email/transport";

type Message = { to: string; subject: string; url: string; action: "verify" | "reset" };

export async function sendAuthenticationEmail(message: Message): Promise<void> {
  const label = message.action === "verify" ? "Verify your email" : "Reset your password";
  await sendMail({
    to: message.to,
    subject: message.subject,
    text: `${label} for Momentum. Open this one-time link: ${message.url}\n\nIf you did not request this, ignore this email.`,
  });
}

export async function sendCodeEmail(message: {
  to: string;
  code: string;
  type: "email-verification" | "sign-in" | "forget-password" | "change-email";
}): Promise<void> {
  const subject = message.type === "email-verification"
    ? "Verify your Momentum account"
    : message.type === "sign-in" ? "Your Momentum sign-in code" : message.type === "change-email" ? "Confirm your Momentum email change" : "Your Momentum recovery code";
  await sendMail({
    to: message.to,
    subject,
    text: `Your Momentum verification code is ${message.code}. It expires in 10 minutes. If you did not request this, ignore the email.`,
  });
}
