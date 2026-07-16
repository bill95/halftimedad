"use client";

import { FormEvent, useMemo, useState } from "react";
import FeaturedSponsor from "@/components/FeaturedSponsor";

export default function Home() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [challenge, setChallenge] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const shareUrl = useMemo(() => "https://halftimedad.co/?utm_source=founding_dad&utm_medium=referral", []);
  const shareText = "I just joined HalfTimeDad as a Founding Dad. It is a practical toolkit and community for divorced and co-parenting dads. Grab an early spot:";

  async function submit(event: FormEvent) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");
    const source = new URLSearchParams(window.location.search).get("utm_source") || "direct";
    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, firstName, challenge, source })
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
    } else {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      setMessage("Invite copied to your clipboard.");
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setMessage("Referral link copied.");
  }

  return (
    <main>
      <nav className="nav wrap">
        <a className="brand" href="#top"><span className="mark">HTD</span><span>HalfTimeDad</span></a>
        <a className="navCta" href="#join">Become a Founding Dad</a>
      </nav>

      <section className="hero wrap" id="top">
        <div className="heroCopy">
          <p className="eyebrow">THE SECOND HALF STARTS NOW</p>
          <h1>Divorced dads deserve a better playbook.</h1>
          <p className="lede">Practical tools, honest support, and a little humor for dads navigating co-parenting, money, school, dating, and everything nobody prepared us for.</p>
          <div className="heroActions">
            <a className="primary" href="#join">Claim a Founding Spot</a>
            <a className="secondary" href="#roadmap">See what we’re building</a>
          </div>
          <p className="micro">No spam. No judgment. No inspirational mountain-climbing photos.</p>
        </div>
        <div className="scorecard">
          <p className="eyebrow">FOUNDING ROSTER</p>
          <strong>First 250</strong>
          <span>dads get permanent founding status, early access, and launch pricing.</span>
          <div className="progress"><i /></div>
          <small>Now recruiting the starting lineup</small>
        </div>
      </section>

      <section className="proof wrap">
        <div><b>Built for real life</b><span>Useful tools, not generic advice.</span></div>
        <div><b>Private by default</b><span>Your family business stays yours.</span></div>
        <div><b>Made with dads</b><span>Founders help shape the roadmap.</span></div>
      </section>

      <FeaturedSponsor />

      <section className="section wrap" id="roadmap">
        <p className="eyebrow">COMING OUT OF THE LOCKER ROOM</p>
        <h2>One membership. A growing toolkit.</h2>
        <div className="cards">
          {[
            ["Peace Monitor", "Track the calm with a completely unofficial counter and shareable dashboard."],
            ["Message Rewriter", "Turn emotional drafts into calm, useful co-parenting messages before you hit send."],
            ["Dad Dashboard", "Keep schedules, expenses, school notes, goals, and important details in one place."],
            ["Playbook Library", "Templates and practical guides for school, money, legal organization, dating, and parenting."],
            ["Expense Splitter", "Document shared child expenses without rebuilding a spreadsheet every month."],
            ["The Locker Room", "A private member community with fewer hot takes and more useful answers."]
          ].map(([title, copy], index) => (
            <article className="card" key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>
          ))}
        </div>
      </section>

      <section className="founder wrap" id="join">
        {status !== "success" ? (
          <div className="joinGrid">
            <div>
              <p className="eyebrow">BECOME A FOUNDING DAD</p>
              <h2>You’re not joining another newsletter.</h2>
              <p>You’re helping build the platform we wish existed when the second half began.</p>
              <ul><li>Lifetime Founding Dad status</li><li>Early access to every new tool</li><li>A voice in what gets built next</li><li>Exclusive launch pricing</li></ul>
            </div>
            <form onSubmit={submit}>
              <label>First name <span>optional</span><input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Bill" /></label>
              <label>Email address<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="dad@example.com" /></label>
              <label>What is the hardest part of the second half? <span>optional</span><textarea value={challenge} onChange={e => setChallenge(e.target.value)} placeholder="Co-parenting communication, money, schedules, dating..." /></label>
              <button className="primary full" disabled={status === "loading"}>{status === "loading" ? "Saving your spot..." : "Become a Founding Dad"}</button>
              {status === "error" && <p className="error">{message}</p>}
              <small>By joining, you agree to receive HalfTimeDad updates. Unsubscribe anytime.</small>
            </form>
          </div>
        ) : (
          <div className="success">
            <p className="eyebrow">WELCOME TO THE LOCKER ROOM</p>
            <h2>You’re officially a Founding Dad.</h2>
            <p>Help us fill the starting lineup. Send HalfTimeDad to one dad who could use a better playbook.</p>
            <div className="shareGrid">
              <button onClick={nativeShare}>Share</button>
              <a href={`sms:?&body=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}>Text a Dad</a>
              <a href={`mailto:?subject=${encodeURIComponent("Join me as a Founding Dad")}&body=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`}>Email a Dad</a>
              <button onClick={copyLink}>Copy Link</button>
            </div>
            {message && <p className="notice">{message}</p>}
          </div>
        )}
      </section>

      <section className="mission wrap">
        <p className="eyebrow">DAD FORWARD</p>
        <h2>The membership should help more than its members.</h2>
        <p>A portion of future HalfTimeDad proceeds will support an actual divorced dad in the wild who could use a hand getting through the second half.</p>
      </section>

      <footer className="wrap"><b>HalfTimeDad</b><span>Helping dads win the second half.</span><small>Not legal, financial, medical, or co-parent-approved advice.</small></footer>
    </main>
  );
}
