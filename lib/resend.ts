import { Resend } from "resend";

/**
 * Optional: call from Stripe webhook when you add a verified sending domain in Resend.
 */
export async function sendProWelcomeEmail(to: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!key || !from) return;

  const resend = new Resend(key);
  await resend.emails.send({
    from,
    to,
    subject: "You're on CardSnap Pro",
    html: "<p>Thanks for upgrading — you now have unlimited card scans.</p>",
  });
}
