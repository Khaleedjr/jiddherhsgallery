import nodemailer, { type Transporter } from "nodemailer";
import { site } from "@/lib/site";

/**
 * Outgoing email over SMTP. Server-only.
 *
 * Gmail (the store's jidderhsgallery@gmail.com) works out of the box:
 *   SMTP_USER=jidderhsgallery@gmail.com
 *   SMTP_PASS=<16-character Google app password>
 * SMTP_HOST defaults to smtp.gmail.com and SMTP_PORT to 465. Any other
 * provider (Zoho, Brevo, Mailgun…) works by setting SMTP_HOST/SMTP_PORT too.
 * MAIL_FROM overrides the sender, e.g. "Jidderh's Gallery <orders@…>".
 * With no SMTP_USER/SMTP_PASS (and no SMTP_HOST), email is off: callers
 * record that the receipt wasn't sent instead of failing.
 */

const env = (key: string) => process.env[key]?.trim() || "";

export function isEmailConfigured() {
  return Boolean((env("SMTP_USER") && env("SMTP_PASS")) || env("SMTP_HOST"));
}

let transporter: Transporter | null = null;
let transporterKey = "";

function getTransporter() {
  const host = env("SMTP_HOST") || "smtp.gmail.com";
  const port = Number(env("SMTP_PORT") || 465);
  const user = env("SMTP_USER");
  const pass = env("SMTP_PASS");
  const key = [host, port, user, pass].join("|");
  if (!transporter || key !== transporterKey) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    });
    transporterKey = key;
  }
  return transporter;
}

const sender = () => env("MAIL_FROM") || `${site.name} <${env("SMTP_USER") || site.email}>`;

export async function sendMail(message: { to: string; subject: string; html: string; text: string }) {
  if (!isEmailConfigured()) throw new Error("Email isn't set up (SMTP_USER and SMTP_PASS are missing).");
  await getTransporter().sendMail({
    from: sender(),
    replyTo: site.email,
    to: message.to,
    subject: message.subject,
    html: message.html,
    text: message.text,
  });
}
