/**
 * Shows Bill has been a guest on, keyed by the utm_source their short link
 * sets (see SHORT_LINKS in next.config.ts). A listener who arrives through one
 * gets a welcome band at the top of the homepage naming the show and the code.
 * Add one entry per show, matching the utm_source exactly.
 */
export type PodcastGuestSpot = {
  show: string;
  host: string;
  /** Stripe promotion code for listeners, shown in the band. */
  code?: string;
  /** What the code does, in a few words. */
  offer?: string;
};

export const PODCAST_GUEST_SPOTS: Record<string, PodcastGuestSpot> = {
  "dont-pick-the-scab": {
    show: "Don't Pick the Scab",
    host: "David Webb",
    code: "SCAB",
    offer: "your first month of membership free",
  },
};
