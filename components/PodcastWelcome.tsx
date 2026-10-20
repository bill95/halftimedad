"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { PODCAST_GUEST_SPOTS, type PodcastGuestSpot } from "@/content/podcast-guests";
import { readSource, trackClient } from "@/components/Attribution";

/**
 * "Heard Bill on <show>?" band for listeners who came in through a show's
 * short link. Reads utm_source from the URL first, then the first-touch
 * cookie, so it still shows if he wanders off and comes back. Renders nothing
 * for everyone else, and nothing on the server (no hydration mismatch).
 */
export default function PodcastWelcome() {
  const [spot, setSpot] = useState<PodcastGuestSpot | null>(null);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("utm_source");
    const fromCookie = readSource().split("/")[0];
    const key = fromUrl && PODCAST_GUEST_SPOTS[fromUrl] ? fromUrl : fromCookie;
    const match = PODCAST_GUEST_SPOTS[key];
    if (match) {
      setSpot(match);
      trackClient("podcast_welcome_seen", { show: key });
    }
  }, []);

  if (!spot) return null;

  return (
    <section className="podcast-welcome" aria-label={`Welcome, ${spot.show} listeners`}>
      <div className="section-shell podcast-welcome-inner">
        <Image src="/bill.jpg" alt="" width={52} height={52} className="podcast-welcome-photo" />
        <div className="podcast-welcome-copy">
          <strong>Heard me on {spot.show}? Welcome.</strong>
          <span>
            {`Thanks to ${spot.host} for having me. Start with The Script below. It’s free and you don’t need to sign up.`}
            {spot.code ? (
              <>
                {" "}If you want the full membership, code <code>{spot.code}</code> gets you {spot.offer}.
              </>
            ) : null}
          </span>
        </div>
        <span className="podcast-welcome-sign">&mdash; Bill</span>
      </div>
    </section>
  );
}
