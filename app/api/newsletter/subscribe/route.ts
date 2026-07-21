import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { email?: string; firstName?: string };
    const email = String(body.email || "").trim().toLowerCase();
    const firstName = String(body.firstName || "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "A valid email address is required." }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    const topicId = process.env.RESEND_NEWSLETTER_TOPIC_ID;

    if (!apiKey || !audienceId) {
      console.error("Newsletter: RESEND_API_KEY or RESEND_AUDIENCE_ID not configured");
      return NextResponse.json({ message: "Newsletter signup is temporarily unavailable." }, { status: 503 });
    }

    // Upsert contact into Resend audience
    const contactRes = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        first_name: firstName || undefined,
        unsubscribed: false,
      }),
    });

    if (!contactRes.ok) {
      const err = await contactRes.text();
      console.error("Newsletter: Resend contact upsert failed", contactRes.status, err);
      return NextResponse.json({ message: "We could not complete your signup. Please try again." }, { status: 500 });
    }

    const contactData = (await contactRes.json()) as { id?: string };
    const contactId = contactData.id;

    // Subscribe to the Sunday Reset topic if configured
    if (topicId && contactId) {
      const topicRes = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts/${contactId}/topics/${topicId}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ subscribed: true }),
      });
      if (!topicRes.ok) {
        console.error("Newsletter: topic subscription failed", topicRes.status, await topicRes.text());
      }
    }

    // Fire custom event to trigger Resend automation welcome sequence
    // Correct endpoint: POST /events with email to identify the contact
    const eventRes = await fetch("https://api.resend.com/events", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "sunday_reset.subscribed",
        name: "sunday_reset.subscribed",
        email,
        payload: { first_name: firstName || "" },
      }),
    });

    if (!eventRes.ok) {
      const eventErr = await eventRes.text();
      console.error("Newsletter: automation event failed", eventRes.status, eventErr);
    } else {
      console.log("Newsletter: automation event fired successfully", eventRes.status);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Newsletter subscribe error:", error);
    return NextResponse.json({ message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
