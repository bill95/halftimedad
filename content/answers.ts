/**
 * Public answer pages at /answers/<slug>.
 *
 * Each one is shaped around a question a dad actually types into Google or
 * asks ChatGPT, answered plainly in the first few sentences so search engines
 * and AI assistants can quote it, then pointed at a free tool.
 *
 * Rules for these pages:
 *   - General, practical guidance in the "we" voice. No first-person stories
 *     unless they come from Bill (library content comes from his experience).
 *   - Never legal advice. Every page ends with the legal notice, and any part
 *     that depends on the law points to an attorney instead of answering.
 *   - published: false renders a noindex draft for review at its URL, and
 *     keeps it out of the sitemap and the /answers index. Flip to true once
 *     Bill has read and approved it.
 */

export type Answer = {
  slug: string;
  question: string;
  /** Two or three sentences. The part an assistant quotes. */
  short: string;
  /** Markdown: ## headings, paragraphs, lists. */
  body: string;
  /** Where the page sends him next. */
  tool: { href: string; label: string; pitch: string };
  /** Shown above the legal notice: the part of this topic that is a legal question. */
  legalEdge: string;
  published: boolean;
  updated: string;
};

export const ANSWERS: Answer[] = [
  {
    slug: "how-to-respond-to-a-hostile-text-from-your-ex",
    question: "How do I respond to a hostile text from my ex?",
    short:
      "Wait before you answer, then reply only to the part that needs a reply: the facts, the logistics, the kids. Leave the accusations and the tone alone. Two to four calm sentences that a judge, your kids, or your future self could read without wincing is almost always the right length.",
    body: `## Wait first

Unless the message is about a child's safety or a pickup in the next hour, it can wait. An hour is good. Overnight is often better. The first reply you want to send is usually the one that keeps the argument going.

## Find the one part that needs an answer

Most hostile messages are a small question wrapped in a lot of heat. Read it once and pull out the part that actually needs a response: a time, a place, a yes or no, a fact about the kids. That is the whole job.

## Leave the rest alone

You do not have to correct every characterization or defend yourself against every line. Answering the accusations tells the other person those lines work. Not answering them is not agreeing with them.

## Keep it short, factual, and unremarkable

- Two to four sentences.
- Facts, times, and specifics only.
- No sarcasm, no "you always" or "you never", no history.
- No threats, and no mention of lawyers or court in a logistics message.
- Friendly enough to be boring. Not warm, not cold.

## Assume it will be read by someone else

Co-parenting messages get screenshotted, forwarded, and sometimes printed. Write every reply as if a stranger who cares about your kids will read it someday. If you would be fine with that, send it.

## When not to reply at all

If a message is purely venting, has no question in it, and nothing is changing for the kids, it may not need a reply. If it does need an acknowledgment, "Got it." is a complete sentence.`,
    tool: {
      href: "/#script",
      label: "Try The Script",
      pitch: "Paste the message you got, or the one you are about to send, and get back a calm version you can send as is. Free, and nothing you type is saved.",
    },
    legalEdge:
      "If the message mentions changing the custody schedule, child support, moving away with the kids, or going back to court, the wording of your reply can matter legally. Talk to a family law attorney before you answer that part.",
    published: false,
    updated: "2026-11-09",
  },
  {
    slug: "what-to-tell-your-kids-about-divorce",
    question: "What should I tell my kids about the divorce?",
    short:
      "Tell them together if you can, keep it short, and keep it true: both parents love them, this is a grown-up decision, it is not their fault, and here is what will stay the same. Leave out the reasons, the blame, and the adult details. Then let them ask questions, today and for weeks after.",
    body: `## What every kid needs to hear

- Both parents love them, and that is not changing.
- This is a grown-up decision. They did not cause it and they cannot fix it.
- What stays the same: their school, their friends, their stuff, whatever is true.
- What is changing, in concrete terms they can picture.
- They can feel however they feel about it, and they can ask anything.

## What to leave out

The reasons, who decided, money, the legal process, and anything that makes one parent the villain. Kids hear criticism of their other parent as criticism of half of themselves.

## Match it to their age

Younger kids need the routine more than the reasons: where they will sleep, who picks them up. School-age kids often worry it is their fault, so say plainly that it is not. Teenagers will notice if they are being handled. Be honest in a few words, ask for their input where it is genuinely their choice, and be clear about what is not.

## Tell them together if you can

If you and their other parent can manage one calm conversation together, it tells the kids you are both still their parents. If that is not possible, use the same basic words so the story matches.

## It is a conversation, not a speech

Expect the questions to come later, at bedtime or in the car. Short, true answers, repeated as often as needed, do more than one perfect talk.`,
    tool: {
      href: "/tell-the-kids",
      label: "Find the words",
      pitch: "Pick the moment and their ages and get words you can say out loud, the questions they are likely to ask, and what to leave out. Free and private.",
    },
    legalEdge:
      "If you are not sure yet what the schedule will be, do not promise one. What the custody arrangement will look like is a legal question, and it is worth an answer from a family law attorney or mediator before you tell the kids.",
    published: false,
    updated: "2026-11-09",
  },
  {
    slug: "how-to-tell-kids-you-are-moving-out",
    question: "How do I tell my kids I'm moving out?",
    short:
      "Tell them before the move, not on moving day, and tell them where you are going and when they will be with you. Say it is a grown-up decision, that it is not their fault, and that you are still their dad every day of the week. Then show them, by keeping the first visits and calls exactly when you said you would.",
    body: `## Timing

A few days to a couple of weeks before the move is usually right. Long enough to ask questions and get used to it, short enough that it does not hang over them for months. Avoid right before school or bedtime if you can.

## Make it concrete

Kids handle change better when they can picture it. Tell them:

- Where you are going, and whether they will have a room or a bed there.
- When they will be with you next.
- How they can reach you when they are not.

If they can see the new place before they stay there, that helps.

## What to say about why

Keep it to one true sentence: something like "Mom and I have decided we will be better parents living in two homes." Do not explain who decided or what went wrong.

## What not to do

- Do not ask them to choose where they want to live.
- Do not ask them to keep anything from their other parent.
- Do not promise a schedule that is not settled yet.
- Do not let them feel responsible for how you are doing.

## The first few weeks matter most

The talk sets expectations. Keeping them is what builds trust. Show up exactly when you said you would, call when you said you would, and keep the new place boring and predictable for a while.`,
    tool: {
      href: "/tell-the-kids",
      label: "Find the words",
      pitch: "Pick \"One of us is moving out\" and their ages, and get words written for that conversation. Free and private.",
    },
    legalEdge:
      "Moving out of the family home can affect custody and property in some states, and the timing can matter. Talk to a family law attorney before you move, not after.",
    published: false,
    updated: "2026-11-09",
  },
];

export const PUBLISHED_ANSWERS = ANSWERS.filter((answer) => answer.published);

export function getAnswer(slug: string) {
  return ANSWERS.find((answer) => answer.slug === slug) ?? null;
}
