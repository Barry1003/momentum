import "server-only";
import { sendMail } from "@/modules/email/transport";

/** Sends a short code email through the same provider as sign-in. Never logs addresses or codes. */
export async function sendAccountCode(message: { to: string; code: string; purpose: "email-change" | "delete-account" }): Promise<void> {
  const subject = message.purpose === "email-change" ? "Confirm your new Momentum email" : "Confirm deleting your Momentum account";
  const action = message.purpose === "email-change" ? "change the email on your Momentum account" : "delete your Momentum account (it is removed after 14 days and you can cancel until then)";
  await sendMail({
    to: message.to,
    subject,
    text: `Your code to ${action} is ${message.code}. It expires in 10 minutes. If you didn't ask for this, ignore this email and your account stays as it is.`,
  });
}

/** Lets the old address know the account email changed. */
export async function sendEmailChangedNotice(to: string): Promise<void> {
  await sendMail({
    to,
    subject: "Your Momentum email was changed",
    text: "The email on your Momentum account was just changed. If this wasn't you, reply to this email or contact support straight away.",
  });
}
