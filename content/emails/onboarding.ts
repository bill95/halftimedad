/**
 * Free account onboarding: four letters over nine days.
 *
 *   1  day 0  You're in             sent from auth/callback at signup
 *   2  day 2  The Script            sent by /api/cron/onboarding
 *   3  day 5  The count             sent by /api/cron/onboarding
 *   4  day 9  The paid half         sent by /api/cron/onboarding, skipped if he already joined
 *
 * Same letter format as the welcome sequence and the Sunday nudge: from Bill,
 * plain, one link, one reason to click it. Copy is a draft for Bill to edit.
 * No em dashes, by request.
 */

export type OnboardingStep = 1 | 2 | 3 | 4;
export const ONBOARDING_DAYS: Record<OnboardingStep, number> = { 1: 0, 2: 2, 3: 5, 4: 9 };

type Letter = { subject: string; paragraphs: string[]; link: { label: string; path: string } };

const LETTERS: Record<OnboardingStep, Letter> = {
  1: {
    subject: "You're in. Here's where to start.",
    paragraphs: [
      "Your free account is set up. No password, no card, and nothing to catch up on.",
      "Three things are yours now. A play every week, picked from what you told us about where you are. The Peace Monitor, which counts the days you kept it clean and now follows you to any device. And The Script, three times a month, for the message you do not know how to answer.",
      "Start with this week's play. It takes two minutes.",
    ],
    link: { label: "Open this week's play", path: "/member" },
  },
  2: {
    subject: "The message you haven't answered yet",
    paragraphs: [
      "There is probably one sitting on your phone right now. The one you read twice, typed three replies to, and deleted all of them.",
      "That is what The Script is for. Paste what you want to say, the way you want to say it. You get back a version that states the facts, keeps the kids at the center, and does not hand anyone a screenshot to use later.",
      "You do not have to send it. Sometimes seeing the calm version is enough to know what you actually want to say.",
    ],
    link: { label: "Open The Script", path: "/member/script" },
  },
  3: {
    subject: "Start the count",
    paragraphs: [
      "You already keep a detailed record of the worst of it. The texts, the dates, the things that were said. Nobody keeps the other one.",
      "The Peace Monitor counts the days you kept it clean. No reacting, no taking the bait, no sending the one you would regret. It only counts your side, because your side is the only part you control.",
      "It is a little bit of a joke and a little bit not. Most of the dads who start it are surprised by the number.",
    ],
    link: { label: "Start your count", path: "/peace-monitor#mine" },
  },
  4: {
    subject: "Why I built the paid half",
    paragraphs: [
      "You have had the free half for about a week. I hope some of it helped.",
      "The paid half is the part I wish I had in my first year. The whole library: plays, scripts and guides for exchanges, money, dating, your body, and the first year, written from what actually happened to me. A three-question check-in every Sunday that turns into a record of how the weeks are really going. And The Script whenever you need it, not three times a month.",
      "Founding membership is $9.99 a month or $99 a year, and that price stays locked for as long as you stay. It goes up when the doors open publicly on January 31.",
      "No pressure either way. The free half is yours regardless.",
    ],
    link: { label: "See founding membership", path: "/member/upgrade" },
  },
};

function escape(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function onboardingLetter(
  step: OnboardingStep,
  opts: { firstName: string | null; siteUrl: string; unsubscribeToken: string | null }
) {
  const letter = LETTERS[step];
  const hello = opts.firstName ? `${opts.firstName},` : "Hey,";
  const href = `${opts.siteUrl}${letter.link.path}?utm_source=onboarding&utm_campaign=step-${step}`;
  const unsubscribe = opts.unsubscribeToken ? `${opts.siteUrl}/unsubscribe/nudge?t=${opts.unsubscribeToken}` : null;

  const text = [
    hello,
    "",
    ...letter.paragraphs.flatMap((p) => [p, ""]),
    `${letter.link.label}: ${href}`,
    "",
    "Reply any time. It comes to me.",
    "",
    "Bill",
    ...(unsubscribe ? ["", "---", `Turn off these emails: ${unsubscribe}`] : []),
  ].join("\n");

  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#ffffff;color:#1f2a24;font-family:Georgia,'Times New Roman',serif;font-size:17px;line-height:1.6">
<div style="max-width:560px;margin:0 auto">
<p>${escape(hello)}</p>
${letter.paragraphs.map((p) => `<p>${escape(p)}</p>`).join("\n")}
<p style="margin:28px 0"><a href="${escape(href)}" style="display:inline-block;background:#1f3a2c;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:6px;font-family:Arial,sans-serif;font-size:16px">${escape(letter.link.label)}</a></p>
<p>Reply any time. It comes to me.</p>
<p>Bill</p>
${unsubscribe ? `<p style="margin-top:40px;font-family:Arial,sans-serif;font-size:12px;color:#7b8a80"><a href="${escape(unsubscribe)}" style="color:#7b8a80">Turn off these emails</a></p>` : ""}
</div></body></html>`;

  return { subject: letter.subject, text, html };
}
