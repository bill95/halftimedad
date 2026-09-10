import { FALLBACK_PLAY, PLAYS, type Play } from "@/content/plays";
import type { Conflict, Custody, FocusArea, Stage } from "@/content/profile-options";
import { weekOf } from "@/lib/member";

type Situation = {
  stage?: string | null;
  custody?: string | null;
  conflict?: string | null;
  focus_now?: string | null;
};

/**
 * Picks the play. Plays for the member's focus area are scored by how many
 * of their `when` conditions match: a play with no conditions is the
 * baseline, and a more specific one beats it whenever it applies.
 *
 * Ties rotate weekly rather than resolving to the first entry, so a member
 * who sits in the same situation for a month does not stare at the same
 * card for a month.
 */
export function selectPlay(situation: Situation | null | undefined, week = weekOf()): Play {
  const focus = situation?.focus_now as FocusArea | undefined;
  if (!focus) return FALLBACK_PLAY;

  const candidates = PLAYS.filter((play) => play.focus === focus);
  if (!candidates.length) return FALLBACK_PLAY;

  let best = -1;
  let winners: Play[] = [];

  for (const play of candidates) {
    const when = play.when;
    let score = 0;
    let disqualified = false;

    if (when?.conflict) {
      if (when.conflict.includes(situation?.conflict as Conflict)) score += 1;
      else disqualified = true;
    }
    if (when?.stage) {
      if (when.stage.includes(situation?.stage as Stage)) score += 1;
      else disqualified = true;
    }
    if (when?.custody) {
      if (when.custody.includes(situation?.custody as Custody)) score += 1;
      else disqualified = true;
    }
    if (disqualified) continue;

    if (score > best) {
      best = score;
      winners = [play];
    } else if (score === best) {
      winners.push(play);
    }
  }

  if (!winners.length) return candidates[0] ?? FALLBACK_PLAY;

  const weekIndex = Math.floor(Date.parse(`${week}T00:00:00Z`) / 604_800_000);
  return winners[Math.abs(weekIndex) % winners.length];
}
