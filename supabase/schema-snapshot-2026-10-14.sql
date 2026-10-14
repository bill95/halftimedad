-- Production schema snapshot: public schema of Supabase project
-- stfazjjdwdtkmjqcnphx, read from the live database on 2026-10-14, BEFORE the
-- two migrations of the same date in this folder:
--   2026-10-14-founding-members-lockdown.sql      (drops "own row update", revokes member writes)
--   2026-10-14-founder-numbers-at-payment.sql     (founding_reservations, assign_founder)
--
-- This is a reference, not a migration. It exists so the repo shows what the
-- database actually enforces: gating lives here as much as in lib/access.ts.
-- supabase.sql at the repo root is the original bootstrap and is out of date.
--
-- Read this before writing to a table with a member's session: on several
-- tables the policies allow a write that the grants below do not.
--
-- Enum types (asset_medium, asset_kind, member_stage, focus_area,
-- custody_arrangement, conflict_level, badge_kind) are not reproduced here.

------------------------------------------------------------------ tables

create table if not exists public.founding_members (
  founder_number bigint generated always as identity primary key check (founder_number >= 1 and founder_number <= 100),
  created_at timestamptz not null default now(),
  first_name text not null,
  email text not null unique,
  challenge text,
  plan_interest text not null check (plan_interest in ('monthly', 'annual')),
  referral_code text not null unique,
  referred_by text,
  status text not null default 'interested' check (status in ('interested', 'checkout_pending', 'active', 'past_due', 'cancelled')),
  stripe_customer_id text,
  stripe_subscription_id text,
  activated_at timestamptz,
  user_id uuid references auth.users (id) on delete set null
);

create table if not exists public.member_profiles (
  user_id uuid not null primary key references auth.users (id) on delete cascade,
  stage member_stage,
  custody custody_arrangement,
  conflict conflict_level,
  kids jsonb not null default '[]'::jsonb,
  focus_now focus_area,
  focus_set_at timestamptz,
  region text,
  timezone text not null default 'America/Los_Angeles',
  charter_accepted_at timestamptz,
  charter_version text,
  access_granted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  weekly_nudge boolean not null default true,
  nudge_token uuid not null default gen_random_uuid()
);

create table if not exists public.check_ins (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  week_of date not null,
  holding_up integer not null check (holding_up >= 1 and holding_up <= 5),
  hardest text,
  next_right text,
  shareable boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, week_of)
);
-- Production also carries a duplicate check constraint, check_ins_holding_up_range, with the same rule.

create table if not exists public.assets (
  id uuid not null default gen_random_uuid() primary key,
  slug text not null unique,
  title text not null,
  dek text,
  medium asset_medium not null,
  duration_min integer not null,
  body_md text,
  media_url text,
  stages member_stage[] not null default '{}',
  focus_areas focus_area[] not null default '{}',
  custody_fit custody_arrangement[] not null default '{}',
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  kind asset_kind not null default 'guide',
  source_issue text,
  object_number smallint
);

create table if not exists public.badges (
  slug text not null primary key,
  kind badge_kind not null,
  label text not null,
  description text,
  icon text,
  self_claim boolean not null default false,
  pod_visible boolean not null default false,
  sort_order integer not null default 100
);

create table if not exists public.member_badges (
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_slug text not null references public.badges (slug),
  earned_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb,
  primary key (user_id, badge_slug)
);

create table if not exists public.monitor_state (
  user_id uuid not null primary key references auth.users (id) on delete cascade,
  streak_started_at timestamptz not null default now(),
  longest_streak integer not null default 0,
  lifetime_resets integer not null default 0,
  total_clean_days integer not null default 0,
  adopted_local_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint monitor_state_non_negative check (longest_streak >= 0 and lifetime_resets >= 0 and total_clean_days >= 0)
);

create table if not exists public.nudge_sends (
  user_id uuid not null references auth.users (id) on delete cascade,
  week_of date not null,
  kind text not null default 'sunday',
  sent_at timestamptz not null default now(),
  primary key (user_id, week_of, kind)
);

create table if not exists public.script_usage (
  id uuid not null default gen_random_uuid() primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  channel text not null,
  outcome text not null,
  input_chars integer not null,
  output_chars integer not null,
  was_paid boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists public.stripe_webhook_events (
  event_id text not null primary key,
  event_type text not null,
  stripe_created_at timestamptz not null,
  claimed_at timestamptz not null default now(),
  processed_at timestamptz
);

-- RLS is enabled on every table above. An event trigger, rls_auto_enable(),
-- turns it on for any new table created in public.

------------------------------------------------------------ member grants
-- What the authenticated role may do at all, before policies apply. anon has
-- no read or write on any of these. (Supabase's default REFERENCES, TRIGGER
-- and TRUNCATE grants are omitted; PostgREST does not expose them.)
--
--   table                 authenticated may
--   assets                SELECT
--   badges                SELECT
--   check_ins             SELECT, INSERT, UPDATE
--   founding_members      SELECT, UPDATE            <- UPDATE removed by the lockdown migration
--   member_badges         SELECT, INSERT            (no DELETE: unclaim goes through the service role)
--   member_profiles       SELECT, UPDATE (weekly_nudge only)
--   monitor_state         SELECT                    (writes go through the service role)
--   nudge_sends           SELECT
--   script_usage          SELECT                    (writes go through the service role)
--   stripe_webhook_events none

---------------------------------------------------------------- policies

create policy "paid members read published" on public.assets for select to public
  using (published = true and is_paid_member());
create policy "members read badges" on public.badges for select to public
  using (auth.uid() is not null);

create policy "own checkins read" on public.check_ins for select to public
  using (auth.uid() = user_id);
create policy "own checkins insert" on public.check_ins for insert to public
  with check (auth.uid() = user_id and is_paid_member());
create policy "own checkins update" on public.check_ins for update to public
  using (auth.uid() = user_id and is_paid_member())
  with check (auth.uid() = user_id and is_paid_member());

create policy "own row select" on public.founding_members for select to authenticated
  using (user_id = (select auth.uid()));
-- Dropped by 2026-10-14-founding-members-lockdown.sql:
create policy "own row update" on public.founding_members for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own badges read" on public.member_badges for select to public
  using (auth.uid() = user_id);
create policy "claim self-claim badges" on public.member_badges for insert to public
  with check (auth.uid() = user_id and exists (select 1 from badges b where b.slug = member_badges.badge_slug and b.self_claim));
create policy "unclaim self-claim badges" on public.member_badges for delete to public
  using (auth.uid() = user_id and exists (select 1 from badges b where b.slug = member_badges.badge_slug and b.self_claim));

create policy "own profile read" on public.member_profiles for select to public using (auth.uid() = user_id);
create policy "own profile insert" on public.member_profiles for insert to public with check (auth.uid() = user_id);
create policy "own profile update" on public.member_profiles for update to public using (auth.uid() = user_id);

create policy "own monitor read" on public.monitor_state for select to public using (auth.uid() = user_id);
create policy "own monitor insert" on public.monitor_state for insert to public with check (auth.uid() = user_id);
create policy "own monitor update" on public.monitor_state for update to public
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own nudge sends read" on public.nudge_sends for select to public using (auth.uid() = user_id);

create policy script_usage_select_own on public.script_usage for select to public using (auth.uid() = user_id);
create policy script_usage_insert_own on public.script_usage for insert to public with check (auth.uid() = user_id);

---------------------------------------------------------------- functions

create or replace function public.is_paid_member(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path to 'public', 'pg_temp' as $fn$
  select exists (
    select 1 from public.founding_members f
    where f.user_id = uid and f.status in ('active', 'past_due')
  );
$fn$;

-- Trigger on auth.users: a new account claims any founding row with its email.
create or replace function public.link_founding_member()
returns trigger language plpgsql security definer set search_path to '' as $fn$
begin
  update public.founding_members set user_id = new.id
   where lower(email) = lower(new.email) and user_id is null;
  return new;
end;
$fn$;

-- Trigger on founding_members: a new or changed row picks up an existing account by email.
create or replace function public.link_founder_to_auth_user()
returns trigger language plpgsql security definer set search_path to 'public', 'pg_temp' as $fn$
declare found_uid uuid;
begin
  if new.user_id is null and new.email is not null then
    select u.id into found_uid from auth.users u where lower(u.email) = lower(new.email) limit 1;
    if found_uid is not null then new.user_id := found_uid; end if;
  end if;
  return new;
end;
$fn$;

create or replace function public.award_founding_badge_on_link()
returns trigger language plpgsql security definer set search_path to 'public', 'pg_temp' as $fn$
begin
  if new.user_id is not null and new.status in ('active', 'past_due') then
    insert into public.member_badges (user_id, badge_slug) values (new.user_id, 'founding_dad') on conflict do nothing;
  end if;
  return new;
end;
$fn$;

-- Note: unlike the function above, this one does not check status, so a
-- cancelled or unpaid founding row still earns the badge when a profile is created.
create or replace function public.award_founding_badge()
returns trigger language plpgsql security definer set search_path to '' as $fn$
begin
  if exists (select 1 from public.founding_members f where f.user_id = new.user_id) then
    insert into public.member_badges (user_id, badge_slug) values (new.user_id, 'founding_dad') on conflict do nothing;
  end if;
  return new;
end;
$fn$;

-- Used by app/api/cron/sunday. Paid members with the nudge on who have not
-- checked in this week and have not already been emailed this week.
create or replace function public.sunday_nudge_candidates(p_week date)
returns table (user_id uuid, email text, first_name text, nudge_token uuid, last_next_right text)
language sql stable security definer set search_path to 'public', 'pg_temp' as $fn$
  select p.user_id, u.email::text, f.first_name, p.nudge_token,
    (select c.next_right from public.check_ins c
      where c.user_id = p.user_id and c.next_right is not null and c.week_of < p_week
      order by c.week_of desc limit 1) as last_next_right
  from public.member_profiles p
  join auth.users u on u.id = p.user_id
  join public.founding_members f on f.user_id = p.user_id and f.status in ('active', 'past_due')
  where p.weekly_nudge and u.email is not null
    and not exists (select 1 from public.check_ins c where c.user_id = p.user_id and c.week_of = p_week)
    and not exists (select 1 from public.nudge_sends n where n.user_id = p.user_id and n.week_of = p_week and n.kind = 'sunday');
$fn$;

create or replace function public.touch_focus()
returns trigger language plpgsql set search_path to '' as $fn$
begin
  if new.focus_now is distinct from old.focus_now then new.focus_set_at := now(); end if;
  new.updated_at := now();
  return new;
end;
$fn$;

create or replace function public.touch_monitor_state()
returns trigger language plpgsql as $fn$
begin
  new.updated_at := now();
  return new;
end;
$fn$;

----------------------------------------------------------------- triggers

create trigger on_auth_user_created_link_founder after insert on auth.users
  for each row execute function link_founding_member();
create trigger founding_members_link_user before insert or update of email, user_id, status on public.founding_members
  for each row execute function link_founder_to_auth_user();
create trigger founding_members_award_badge after insert or update of user_id, status on public.founding_members
  for each row execute function award_founding_badge_on_link();
create trigger on_profile_created_award_founding after insert on public.member_profiles
  for each row execute function award_founding_badge();
create trigger member_profiles_touch before update on public.member_profiles
  for each row execute function touch_focus();
create trigger monitor_state_touch before update on public.monitor_state
  for each row execute function touch_monitor_state();
