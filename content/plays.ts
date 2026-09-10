/**
 * The First Play.
 *
 * A member finishes the situation profile and lands on the member home. Until
 * the library opens there is nothing waiting for them there, so this file
 * gives them one concrete thing to do this week, chosen from what they just
 * told us.
 *
 * Plays are data, not logic. Add one by adding an entry. `when` is optional:
 * a play with no `when` is the baseline for that focus area, and a play with
 * `when` outscores it whenever its conditions match. Selection lives in
 * lib/first-play.ts.
 *
 * DRAFT COPY. The mechanics are sound but the wording is not yet Bill's.
 * These should get the same interview pass the library guides get.
 */

import type { Conflict, Custody, FocusArea, Stage } from "@/content/profile-options";

export type Play = {
  /** Stable id. Used for tracking which play a member was shown. */
  slug: string;
  focus: FocusArea;
  when?: {
    conflict?: Conflict[];
    stage?: Stage[];
    custody?: Custody[];
  };
  /** One line naming where they are. No advice in it. */
  read: string;
  title: string;
  /** Two or three things they can actually do this week. */
  steps: string[];
  /** Why this one and not something else. */
  note: string;
};

export const PLAYS: Play[] = [
  /* ---------- Getting steady ---------- */
  {
    slug: "landing-pattern",
    focus: "stability",
    read: "The hours around a handoff are doing more damage than the handoff.",
    title: "The landing pattern",
    steps: [
      "Pick three things that happen every time the kids arrive, in the same order. Bags down, food, one question about their day. It does not matter what they are.",
      "Pick two things that happen every time they leave. Not a goodbye ritual. Something you do after the door closes.",
      "Write both lists down somewhere you will see them Friday.",
    ],
    note: "The transitions are where the week comes apart. A sequence you do not have to decide on is the cheapest stability you can buy.",
  },
  {
    slug: "doorway-script",
    focus: "stability",
    when: { conflict: ["high"] },
    read: "You are steady until you are standing at that door.",
    title: "The doorway script",
    steps: [
      "Write three sentences you can say at an exchange no matter what is said to you. Keep them boring. 'Got it.' 'I will check and let you know.' 'We can talk about that later.'",
      "Say them out loud once in the car before you get out.",
      "Nothing else gets discussed at the door. Anything raised there moves to a message.",
    ],
    note: "You cannot control what happens at the door. You can decide in advance what you will do with it, which is the only half you own.",
  },
  {
    slug: "the-long-gap",
    focus: "stability",
    when: { custody: ["eow", "supervised", "no_contact"] },
    read: "The days you have them are not the problem. The stretch in between is.",
    title: "The long gap",
    steps: [
      "Put one thing on the calendar in the middle of the gap that requires you to show up somewhere and be seen by someone.",
      "Pick the night that is hardest. Give that night a job in advance.",
      "Leave one thing in the house untouched from their visit. A cup, a jacket on the hook. Not a shrine, just proof.",
    ],
    note: "Long gaps do not get filled by trying harder on the days you have them. They get filled on the empty days, on purpose, ahead of time.",
  },

  /* ---------- Talking to their mother ---------- */
  {
    slug: "subject-line",
    focus: "coparent_comms",
    read: "The messages are workable. They are just doing too many jobs at once.",
    title: "One message, one topic",
    steps: [
      "One subject per message. If there are three things, send three messages, or send one and hold the others.",
      "Name the topic in the first four words. 'Thursday pickup:' then the ask.",
      "End with a question or end with a period. Never both.",
    ],
    note: "Most co-parent messages go sideways because they carry a request, a correction and a feeling in the same paragraph. Split them and the temperature drops on its own.",
  },
  {
    slug: "twenty-four-hours",
    focus: "coparent_comms",
    when: { conflict: ["high"] },
    read: "Every message costs you something, and the cost is mostly in how fast you answer.",
    title: "The 24 hour rule",
    steps: [
      "Define urgent narrowly and write the definition down. Injury, illness, or a schedule change inside 48 hours. That is the list.",
      "Anything not on that list waits 24 hours. Not as a tactic. Because your first draft is never your best one.",
      "If a reply is needed sooner, send an acknowledgment only. 'Got it, I will come back to you tonight.'",
    ],
    note: "Speed is what turns a message into a thread and a thread into an incident. The delay is the whole intervention.",
  },

  /* ---------- How the kids are doing ---------- */
  {
    slug: "ten-minute-door",
    focus: "kids_wellbeing",
    read: "You are watching them closely and getting very little back.",
    title: "Ten minutes at the door",
    steps: [
      "Pick one ten minute window that repeats. Bedtime, the drive, the last part of dinner.",
      "In that window, no questions about the other house. Not one, not casually.",
      "Say less than feels right and stay a beat longer than is comfortable.",
    ],
    note: "Kids do not open up on demand, they open up in the presence of someone who is not fishing. The questions about the other house are the thing that closes the door, even when they sound like small talk.",
  },

  /* ---------- Money and legal ---------- */
  {
    slug: "one-folder",
    focus: "money_legal",
    read: "The paperwork is scattered and it is costing you in the moments it matters.",
    title: "One folder",
    steps: [
      "Make one folder. Three subfolders: schedule, money, correspondence.",
      "Everything goes in dated, named by date first. 2026-09-10-pickup-change.",
      "Fifteen minutes on Sunday to file what came in that week. That is the whole system.",
    ],
    note: "Not because you are building a case. Because the alternative is searching your phone at 11pm the night before something, and that is where bad decisions come from.",
  },
  {
    slug: "make-the-record",
    focus: "money_legal",
    when: { stage: ["considering", "filing"] },
    read: "Nothing is filed yet, and the record you have is whatever you happen to remember.",
    title: "Start the record now",
    steps: [
      "Write down the last 90 days as you remember it. Dates, who had the kids, what was agreed. Facts only, no characterization.",
      "Going forward, log the same day it happens. Two lines is enough.",
      "Keep it somewhere your lawyer can read without you editing it first.",
    ],
    note: "The record you start today is the one that is worth something later. The one you reconstruct under pressure is not, and it will read that way.",
  },

  /* ---------- Sleep, food, moving ---------- */
  {
    slug: "two-anchors",
    focus: "body",
    read: "You are running on whatever is in reach, and it shows up in the evening.",
    title: "Two anchors",
    steps: [
      "One meal you can make half asleep, with the ingredients on hand. The same one every week.",
      "One loop you can walk in under thirty minutes from your own door.",
      "Do each one three times this week. Not more.",
    ],
    note: "This is not a fitness plan. It is two decisions you make once so you stop making them badly every day.",
  },

  /* ---------- My own head ---------- */
  {
    slug: "nine-pm-note",
    focus: "head",
    read: "The nights are long and the same twenty minutes keep replaying.",
    title: "Three lines a night",
    steps: [
      "Before bed, three lines. What happened. What I did. What I would do again.",
      "No line about what she did. If it appears, cut it and write the next one.",
      "Read the week back on Sunday before the check-in.",
    ],
    note: "The replay does not stop because you decide to stop it. It stops when it has somewhere to go and something to compare itself against.",
  },

  /* ---------- Rebuilding a life ---------- */
  {
    slug: "one-standing-thing",
    focus: "rebuilding",
    read: "The calendar is full of other people's requirements and nothing of yours.",
    title: "One standing thing",
    steps: [
      "Pick one thing that recurs weekly, same day, same time, that is yours and involves other people.",
      "Put it on the calendar for eight weeks, not one.",
      "Go the first two times whether or not you feel like it. After that decide honestly.",
    ],
    note: "A life does not come back in a big move. It comes back as one fixed point on the week that other things start arranging themselves around.",
  },

  /* ---------- Dating again ---------- */
  {
    slug: "two-doors",
    focus: "dating",
    read: "You are thinking about this, and the question underneath it is about the kids.",
    title: "Two separate doors",
    steps: [
      "Keep this off the kids' radar entirely for now. No mentions, no photos left open, no 'a friend'.",
      "Write down what would have to be true before anyone meets them. Length of time, not feeling.",
      "Check what you wrote in three months instead of relitigating it every week.",
    ],
    note: "Deciding the gate in advance, while nothing is at stake, is the only time you will decide it clearly.",
  },
];

/** Shown when the profile has no focus area yet. */
export const FALLBACK_PLAY: Play = PLAYS[0];
