import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CHARTER_VERSION } from "@/content/charter";

/**
 * Free tier, model A.
 *
 * A free account is a signed-in user with no active founding_members row.
 * Founder numbers stay what they have always been: a payment artifact,
 * issued by the Stripe webhook and never by a signup.
 *
 * This is the single place that answers "what is this person allowed to
 * see". The database answers the same question independently through
 * public.is_paid_member(), so a bug here leaks a route, not the library.
 */

export type Tier = "free" | "paid";

export type Access = {
  userId: string;
  email: string;
  tier: Tier;
  firstName: string | null;
  /** Null for free accounts. Always null until money changes hands. */
  founderNumber: number | null;
  charterCurrent: boolean;
  profile: {
    stage: string | null;
    custody: string | null;
    conflict: string | null;
    focus_now: string | null;
    charter_accepted_at: string | null;
    charter_version: string | null;
  } | null;
};

const PAID_STATUSES = ["active", "past_due"];

/** Reads the session. Returns null when nobody is signed in. */
export async function getAccess(): Promise<Access | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: founder }] = await Promise.all([
    supabase
      .from("member_profiles")
      .select("stage, custody, conflict, focus_now, charter_accepted_at, charter_version")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("founding_members")
      .select("founder_number, first_name, status")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const paid = Boolean(founder?.status && PAID_STATUSES.includes(founder.status));

  return {
    userId: user.id,
    email: user.email ?? "",
    tier: paid ? "paid" : "free",
    firstName: founder?.first_name ?? null,
    founderNumber: paid ? founder?.founder_number ?? null : null,
    charterCurrent:
      Boolean(profile?.charter_accepted_at) && profile?.charter_version === CHARTER_VERSION,
    profile: profile ?? null,
  };
}

/** Any signed-in account, free or paid. */
export async function requireAccess(): Promise<Access> {
  const access = await getAccess();
  if (!access) redirect("/login");
  return access;
}

/**
 * Paid surfaces only: the check-in, the library, anything the charter governs.
 *
 * The charter is checked here rather than at the door on purpose. It governs
 * conduct between members, and a free account has no surface where that
 * conduct happens. Putting six rules in front of a free signup would kill the
 * funnel at its weakest point for no gain.
 */
export async function requirePaid(): Promise<Access> {
  const access = await requireAccess();
  if (access.tier !== "paid") redirect("/member?locked=1");
  if (!access.charterCurrent) redirect("/welcome/charter");
  return access;
}
