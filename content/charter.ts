/**
 * The member charter.
 *
 * Versioned deliberately. member_profiles.charter_version records which text a
 * member accepted, so changing the wording later does not silently rewrite what
 * someone agreed to. Bump CHARTER_VERSION on any substantive edit and existing
 * members will be asked to accept the new one.
 */

export const CHARTER_VERSION = "2026-09-01";

export const CHARTER_TITLE = "What this place is";

export const CHARTER_INTRO = [
  "Before you go in, read this once. It is short, and it is the only thing I will ask you to agree to.",
  "HalfTimeDad is not a support group, a legal service, or a place to win an argument. It is a room built by one dad for another, for the season where the hard part is not knowing what to do but staying steady while you do it.",
];

export type CharterClause = {
  number: string;
  heading: string;
  body: string;
};

export const CHARTER_CLAUSES: CharterClause[] = [
  {
    number: "01",
    heading: "Perspective before reaction",
    body: "The space between the message you get and the response you choose belongs to you. Everything here is built to widen that space. If something in this room makes you want to react faster, close it.",
  },
  {
    number: "02",
    heading: "Your kids are not the audience",
    body: "Nothing you find here is ammunition. Not the scripts, not the plays, not the check-ins. If a tool would be useful mainly for building a case against their mother, it does not belong in your hands or in this room.",
  },
  {
    number: "03",
    heading: "Nobody speaks for your situation but you",
    body: "What worked for another dad is a starting point, not an instruction. You know your kids, your court, and your ex. Take what fits and leave the rest without apology.",
  },
  {
    number: "04",
    heading: "This is not legal or clinical advice",
    body: "I am not a lawyer and I am not a therapist. Nothing here replaces one. If you are dealing with a court order, a safety concern, or something that is not getting better on its own, get a professional in the room.",
  },
  {
    number: "05",
    heading: "What you write here stays here",
    body: "Your check-ins, your profile, and your notes are yours. They are not published, not shared with other members, and not sold. There is no feed and no comments in this version, on purpose.",
  },
  {
    number: "06",
    heading: "Show up at whatever size you can",
    body: "Some weeks you will do the check-in and read the whole library. Some weeks you will open one email and close it. Both count. This is not a streak you can break.",
  },
];

export const CHARTER_CLOSING = [
  "That is the whole charter. If it sounds like something you can hold to, take the next step and the door opens.",
];

export const CHARTER_ACCEPT_LABEL = "I've read this. Let me in.";
