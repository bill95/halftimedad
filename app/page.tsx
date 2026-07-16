"use client";

import { FormEvent, useMemo, useState } from "react";
import FeaturedSponsor from "@/components/FeaturedSponsor";

const plays = [
  ["The Pause", "A simple framework for slowing down before a hard reply, decision, or conversation."],
  ["Message Coach", "Turn an emotional draft into a calm, useful message that keeps the kids at the center."],
  ["Peace Monitor", "Track the calm, notice patterns, and create more space between conflict and response."],
  ["The Playbook", "Practical guidance for schedules, money, school, dating, confidence, and the parts no one prepares you for."],
  ["Dad Dashboard", "Keep the details of the second half organized without rebuilding your life in scattered notes."],
  ["The Village", "A private community built around perspective, practical help, and dads who have been there."],
];

const promises = [
  "Put kids before conflict.",
  "Never encourage unnecessary escalation.",
  "Build practical tools, not noise.",
  "Listen to dads before deciding what to build.",
  "Remember that behind every message is a family.",
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [challenge, setChallenge] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const shareUrl = useMemo(
    () => "https://halftimedad.co/?utm_source=founding_dad&utm_medium=referral",
    []
  );
  const shareText =
    "I joined HalfTimeDad as a Founding Dad. It is a practical village for fathers navigating the hardest seasons of life. Join us:";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const params = new URLSearchParams(window.location.search);
    const source = params.get("utm_source") || "direct";

    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, firstName, challenge, source }),
    });
    const data = await response.json();

    if (!response.ok) {
      setStatus("error");
      setMessage(data.error || "We could not save your spot. Please try again.");
      return;
    }

    setStatus("success");
  }

  async function nativeShare() {
    if (navigator.share) {
      await navigator.share({ title: "HalfTimeDad", text: shareText, url: shareUrl });
      return;
    }

    await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    setMessage("Invite copied to your clipboard.");
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setMessage("Referral link copied.");
  }

  return (
    <main>
      <div className="campaignBar">
        <a href="#join">The Village is forming <span>Join the first 250 Founding Dads →</span></a>
      </div>

      <nav className="nav wrap" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="HalfTimeDad home">
          <span className="mark">HTD</span>
          <span>HalfTimeDad</span>
        </a>
        <div className="navLinks">
          <a href="#why">Why we exist</a>
          <a href="#playbook">The Playbook</a>
          <a href="#promise">Our promise</a>
        </div>
        <a className="navCta" href="#join">Join the Village</a>
      </nav>

      <section className="hero wrap" id="top">
        <div className="heroCopy">
          <p className="eyebrow">PERSPECTIVE BEFORE REACTION</p>
          <h1>No dad should have to navigate the hardest season of his life alone.</h1>
          <p className="lede">
            HalfTimeDad is building the practical tools, honest guidance, and calm perspective dads need before the next message, decision, or difficult day.
          </p>
          <div className="heroActions">
            <a className="primary" href="#join">Become a Founding Dad</a>
            <a className="secondary" href="#why">Why we exist</a>
          </div>
          <p className="micro">Built for every dad. No public founder. No judgment. No chest-thumping.</p>
        </div>

        <aside className="huddleCard" aria-label="The HalfTimeDad pause framework">
          <p className="eyebrow">BEFORE YOU HIT SEND</p>
          <ol>
            <li><span>01</span> Take a breath.</li>
            <li><span>02</span> Remove the emotion.</li>
            <li><span>03</span> State the facts.</li>
            <li><span>04</span> Keep the kids at the center.</li>
          </ol>
          <blockquote>“Is this helping my kids, or is it helping me win?”</blockquote>
        </aside>
      </section>

      <section className="beliefStrip wrap" aria-label="HalfTimeDad principles">
        <div><b>Respond. Don’t react.</b><span>The pause changes everything.</span></div>
        <div><b>Kids over conflict.</b><span>Always the center of the decision.</span></div>
        <div><b>No dad alone.</b><span>Perspective is better with a village.</span></div>
      </section>

      <section className="storySection wrap" id="why">
        <div className="storyIntro">
          <p className="eyebrow">WHY WE EXIST</p>
          <h2>It started with one dad helping another.</h2>
        </div>
        <div className="storyBody">
          <p>
            One father had already walked the road ahead. He was not a lawyer or a therapist. He was simply someone to call before reacting.
          </p>
          <p>
            Difficult emails became calmer conversations. Parenting decisions became clearer. The question stayed the same: <strong>What is actually best for the kids?</strong>
          </p>
          <p>
            Years later, that same support was passed to another dad. That is when the idea became obvious: the most valuable thing was not secret knowledge. It was perspective.
          </p>
          <p className="storyClose">The problem is that not every dad has that village. HalfTimeDad exists to build one.</p>
        </div>
      </section>

      <section className="pauseSection">
        <div className="wrap pauseGrid">
          <div>
            <p className="eyebrow">THE MOST IMPORTANT FEATURE</p>
            <h2>The pause between receiving the message and deciding how to respond.</h2>
          </div>
          <div className="pauseQuote">
            <p>Good dads do not need all the answers.</p>
            <p>They need a place to think clearly, ask questions without judgment, and remember what matters most.</p>
            <strong>HalfTimeDad is that place.</strong>
          </div>
        </div>
      </section>

      <section className="section wrap" id="playbook">
        <p className="eyebrow">WHAT WE’RE BUILDING</p>
        <h2>A better playbook for the second half.</h2>
        <p className="sectionLead">Every tool has one job: help a dad make a better decision, reduce stress, or spend more meaningful time with his kids.</p>
        <div className="cards">
          {plays.map(([title, copy], index) => (
            <article className="card" key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <FeaturedSponsor />

      <section className="promiseSection wrap" id="promise">
        <div>
          <p className="eyebrow">OUR PROMISE</p>
          <h2>We will never profit from keeping families divided.</h2>
          <p>Trust is not a feature. It is the product.</p>
        </div>
        <ul>
          {promises.map((promise) => <li key={promise}>{promise}</li>)}
        </ul>
      </section>

      <section className="founder wrap" id="join">
        {status !== "success" ? (
          <div className="joinGrid">
            <div>
              <p className="eyebrow">THE VILLAGE IS FORMING</p>
              <h2>Become one of the first 250 Founding Dads.</h2>
              <p>
                This is not another newsletter signup. Founding Dads will help shape the first tools, test new ideas, and set the tone for the community.
              </p>
              <ul className="benefitList">
                <li>Permanent Founding Dad status</li>
                <li>Early access to every new tool</li>
                <li>A voice in what gets built next</li>
                <li>Founding pricing when membership launches</li>
              </ul>
            </div>

            <form onSubmit={submit}>
              <label>
                First name <span>optional</span>
                <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="First name" />
              </label>
              <label>
                Email address
                <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="dad@example.com" />
              </label>
              <label>
                What is hardest right now? <span>optional</span>
                <textarea value={challenge} onChange={(event) => setChallenge(event.target.value)} placeholder="Communication, schedules, money, loneliness, dating, school..." />
              </label>
              <button className="primary full" disabled={status === "loading"}>
                {status === "loading" ? "Saving your spot..." : "Join the Founding Team"}
              </button>
              {status === "error" && <p className="error">{message}</p>}
              <small>By joining, you agree to receive HalfTimeDad updates. Unsubscribe anytime.</small>
            </form>
          </div>
        ) : (
          <div className="success">
            <p className="eyebrow">WELCOME TO THE VILLAGE</p>
            <h2>You’re officially a Founding Dad.</h2>
            <p>Help another dad find the pause before he needs it. Send HalfTimeDad to one person who could use a village.</p>
            <div className="shareGrid">
              <button onClick={nativeShare}>Share</button>
              <a href={`sms:?&body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}>Text a Dad</a>
              <a href={`mailto:?subject=${encodeURIComponent("Join the HalfTimeDad founding team")}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`}>Email a Dad</a>
              <button onClick={copyLink}>Copy Link</button>
            </div>
            {message && <p className="notice">{message}</p>}
          </div>
        )}
      </section>

      <footer className="wrap">
        <div><b>HalfTimeDad</b><span>Perspective before reaction.</span></div>
        <small>Practical perspective, not legal, financial, or medical advice.</small>
      </footer>
    </main>
  );
}
