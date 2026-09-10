/**
 * The Sunday nudge.
 *
 * Letter format, plain, from a named person, matching what the welcome
 * sequence established. This is a nudge, not an issue of the newsletter: one
 * link, one reason to click it, nothing to read.
 *
 * If he wrote a next-right-thing last week, it is quoted back to him and it
 * is the whole email. Nothing else in the product tells a man that what he
 * wrote was read.
 */

type NudgeInput = {
  firstName: string | null;
  lastNextRight: string | null;
  siteUrl: string;
  nudgeToken: string;
};

function escape(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function nudgeSubject(lastNextRight: string | null) {
  return lastNextRight ? "The thing you said you would do" : "The check-in is open";
}

export function nudgeText({ firstName, lastNextRight, siteUrl, nudgeToken }: NudgeInput) {
  const hello = firstName ? `${firstName},` : "Hey,";
  const carried = lastNextRight
    ? `Last time, you said the next right thing was:\n\n  ${lastNextRight}\n\nNo need to report on it. It is just yours, and I would rather it did not disappear.\n\n`
    : "";

  return `${hello}

${carried}The check-in is open. Three questions, two minutes, nobody else reads it.

${siteUrl}/member/check-in

If the week was bad, that is a fine thing to write down. The record is only worth something if it is honest.

Bill

---
Turn off these Sunday notes: ${siteUrl}/unsubscribe/nudge?t=${nudgeToken}
`;
}

export function nudgeHtml({ firstName, lastNextRight, siteUrl, nudgeToken }: NudgeInput) {
  const hello = escape(firstName ? `${firstName},` : "Hey,");
  const carried = lastNextRight
    ? `<p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#263a31;">Last time, you said the next right thing was:</p>
       <p style="margin:0 0 18px;padding:2px 0 2px 14px;border-left:2px solid #b65032;font-family:Georgia,serif;font-size:18px;line-height:1.5;color:#14201b;">${escape(
         lastNextRight
       )}</p>
       <p style="margin:0 0 22px;font-size:16px;line-height:1.7;color:#263a31;">No need to report on it. It is just yours, and I would rather it did not disappear.</p>`
    : "";

  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#f3efe5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3efe5;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fbf8f0;border-radius:12px;">
        <tr><td style="padding:32px 28px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
          <p style="margin:0 0 22px;font-size:16px;line-height:1.7;color:#263a31;">${hello}</p>
          ${carried}
          <p style="margin:0 0 22px;font-size:16px;line-height:1.7;color:#263a31;">The check-in is open. Three questions, two minutes, nobody else reads it.</p>
          <p style="margin:0 0 26px;">
            <a href="${siteUrl}/member/check-in" style="display:inline-block;padding:13px 22px;border-radius:999px;background:#153c2f;color:#f3efe5;font-weight:700;font-size:15px;text-decoration:none;">Open this week&rsquo;s check-in</a>
          </p>
          <p style="margin:0 0 22px;font-size:16px;line-height:1.7;color:#263a31;">If the week was bad, that is a fine thing to write down. The record is only worth something if it is honest.</p>
          <p style="margin:0 0 4px;font-size:16px;line-height:1.7;color:#263a31;">Bill</p>
        </td></tr>
        <tr><td style="padding:0 28px 28px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
          <p style="margin:0;padding-top:18px;border-top:1px solid rgba(23,35,29,0.12);font-size:12px;line-height:1.6;color:#7b8a80;">
            <a href="${siteUrl}/unsubscribe/nudge?t=${nudgeToken}" style="color:#7b8a80;">Turn off these Sunday notes</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
