import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CHARTER_VERSION } from "@/content/charter";

export type MemberContext = {
  userId: string;
  email: string;
  firstName: string | null;
  founderNumber: number | null;
  profile: {
    stage: string | null;
    custody: string | null;
    conflict: string | null;
    focus_now: string | null;
    charter_accepted_at: string | null;
    charter_version: string | null;
  } | null;
};

/**
 * Loads the signed-in member and enforces the order of the door:
 * sign in, accept the charter, tell us where you are, then the room.
 *
 * `stage` picks how far along the caller is allowed to be. A page that is
 * itself part of onboarding passes its own stage so it does not bounce
 * the member back to itself.
 */
export async function requireMember(
  stage: "charter" | "profile" | "member" = "member"
): Promise<MemberContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: founder }] = await Promise.all([
    supabase
      .from("member_profiles")
      .select("stage, custody, conflict, focus_now, charter_accepted_at, charter_version")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("founding_members")
      .select("founder_number, first_name")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const charterCurrent =
    Boolean(profile?.charter_accepted_at) && profile?.charter_version === CHARTER_VERSION;
  const profileStarted = Boolean(profile?.stage);

  if (stage !== "charter" && !charterCurrent) redirect("/welcome/charter");
  if (stage === "member" && !profileStarted) redirect("/welcome/profile");

  return {
    userId: user.id,
    email: user.email ?? "",
    firstName: founder?.first_name ?? null,
    founderNumber: founder?.founder_number ?? null,
    profile: profile ?? null,
  };
}

/** Monday-anchored week key, matching check_ins.week_of. */
export function weekOf(date = new Date()): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}
