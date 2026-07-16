import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const firstName = String(body.firstName || "").trim().slice(0, 80);
    const challenge = String(body.challenge || "").trim().slice(0, 2000);
    const source = String(body.source || "direct").trim().slice(0, 120);

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      return NextResponse.json(
        { error: "The waitlist is not connected yet. Add the Supabase environment variables in Vercel." },
        { status: 503 }
      );
    }

    const response = await fetch(`${url}/rest/v1/founding_dads`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        email,
        first_name: firstName || null,
        biggest_challenge: challenge || null,
        source,
      }),
    });

    if (!response.ok) {
      console.error("Supabase waitlist error:", await response.text());
      return NextResponse.json({ error: "We could not save your spot. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
