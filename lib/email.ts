/**
 * Transactional email through Resend.
 *
 * Letter format from a named person, plain styling: during the first weeks of a
 * sending domain, inbox placement matters more than design.
 */

const FROM = "Bill at HalfTimeDad <bill@updates.halftimedad.co>";
const REPLY_TO = "hello@halftimedad.co";

function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://halftimedad.co").replace(/\/$/, "");
}

function escape(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function sendLetter(to: string, subject: string, html: string, text: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not configured");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, reply_to: REPLY_TO, to: [to], subject, html, text }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Resend send failed (${res.status}): ${await res.text()}`);
}

/**
 * Sent once, from the Stripe webhook, when a founding membership is paid.
 * Before this existed a founder paid and then heard nothing about how to get in.
 */
export async function sendFounderWelcome(opts: { email: string; firstName?: string | null; founderNumber: string }) {
  const name = opts.firstName?.trim() || "there";
  const number = opts.founderNumber.padStart(3, "0");
  const signIn = `${siteUrl()}/login?email=${encodeURIComponent(opts.email)}&from=welcome`;

  const subject = `You're in, Founder #${number}`;

  const text = [
    `Hey ${name},`,
    ``,
    `You're Founder #${number}. Thank you for believing in this before it was finished.`,
    ``,
    `Here's how to get in: open the link below, tap "Send my sign-in link," and use the link that lands in this inbox. No password, ever.`,
    ``,
    signIn,
    ``,
    `Once you're in, start with the check-in. Three questions, two minutes, once a week. It's the part that changes how the week goes.`,
    ``,
    `And if you have a message you don't know how to answer, The Script is in there too.`,
    ``,
    `Reply to this email any time. It comes to me.`,
    ``,
    `Bill`,
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#ffffff;color:#1f2a24;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6">
<div style="max-width:560px;margin:0 auto">
<p>Hey ${escape(name)},</p>
<p>You're Founder #${number}. Thank you for believing in this before it was finished.</p>
<p>Here's how to get in: tap the button, then "Send my sign-in link," and use the link that lands in this inbox. No password, ever.</p>
<p style="margin:28px 0"><a href="${escape(signIn)}" style="display:inline-block;background:#1f3a2c;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-family:Arial,sans-serif;font-size:16px">Open your dashboard</a></p>
<p>Once you're in, start with the check-in. Three questions, two minutes, once a week. It's the part that changes how the week goes.</p>
<p>And if you have a message you don't know how to answer, The Script is in there too.</p>
<p>Reply to this email any time. It comes to me.</p>
<p>Bill</p>
</div></body></html>`;

  await sendLetter(opts.email, subject, html, text);
}
