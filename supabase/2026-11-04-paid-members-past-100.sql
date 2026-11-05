-- Paid members past the Founding Hundred. Run in the Supabase SQL editor
-- BEFORE merging the PR that ships it. Safe while the old code is live: the
-- old code calls assign_founder with three arguments, which the new default
-- (p_founding = true) keeps working exactly as before.
--
-- The problem: founding_members is the paid-membership record for everyone
-- (free tier model A), but founder_number is capped at 100 by a check
-- constraint. So:
--   1. From Jan 31, 2027, standard-price members are issued founder numbers
--      and the founding_dad badge, because nothing tells them apart.
--   2. Payment #101 raises inside assign_founder. Stripe has already charged
--      the card, the webhook returns 500, Stripe retries for three days, and
--      the man never gets access.
--   3. The same failure can happen before launch: the 100 check runs when the
--      reservation is made, not when the payment lands.
--
-- After: founder_number is just the member number (no ceiling). A new
-- `founding` column marks the founders. The app passes the tier the checkout
-- was opened at, so a man who opens checkout Jan 30 at the founding price and
-- pays Jan 31 is still a founder. A paid activation can no longer fail on the
-- cap: if a race lands founder #101 at the founding price, he is honored.
--
-- If the SQL editor splits on semicolons inside a function, run each
-- CREATE FUNCTION statement on its own (they use $fn$ delimiters).

alter table public.founding_members add column if not exists founding boolean not null default true;

alter table public.founding_members drop constraint if exists founding_members_founder_number_check;
alter table public.founding_members add constraint founding_members_founder_number_check check (founder_number >= 1);

-- Replace the three-argument version. Keeping both would make PostgREST's
-- named-argument lookup ambiguous.
drop function if exists public.assign_founder(uuid, text, text);

create or replace function public.assign_founder(
  p_reservation uuid,
  p_customer text,
  p_subscription text,
  p_founding boolean default true
) returns bigint
language plpgsql
security definer
set search_path = public, pg_temp
as $fn$
declare
  r public.founding_reservations%rowtype;
  existing public.founding_members%rowtype;
  next_number bigint;
begin
  select * into r from public.founding_reservations where id = p_reservation for update;
  if not found then
    raise exception 'reservation % not found', p_reservation;
  end if;

  if r.status = 'converted' and r.founder_number is not null then
    return r.founder_number;
  end if;

  -- A returning member keeps his number and his founding status.
  select * into existing from public.founding_members where lower(email) = lower(r.email);
  if found then
    update public.founding_members
       set status = 'active',
           plan_interest = r.plan_interest,
           stripe_customer_id = coalesce(p_customer, stripe_customer_id),
           stripe_subscription_id = coalesce(p_subscription, stripe_subscription_id),
           activated_at = now(),
           user_id = coalesce(user_id, r.user_id)
     where founder_number = existing.founder_number;
    next_number := existing.founder_number;
  else
    perform pg_advisory_xact_lock(hashtext('founding_members.founder_number'));
    select coalesce(max(founder_number), 0) + 1 into next_number from public.founding_members;
    insert into public.founding_members (
      founder_number, first_name, email, challenge, plan_interest, referral_code,
      referred_by, status, stripe_customer_id, stripe_subscription_id, activated_at, user_id, founding
    ) overriding system value values (
      next_number, r.first_name, lower(r.email), r.challenge, r.plan_interest, r.referral_code,
      r.referred_by, 'active', p_customer, p_subscription, now(), r.user_id, p_founding
    );
  end if;

  update public.founding_reservations
     set status = 'converted', founder_number = next_number, converted_at = now(), updated_at = now()
   where id = r.id;

  return next_number;
end;
$fn$;

revoke all on function public.assign_founder(uuid, text, text, boolean) from public, anon, authenticated;
grant execute on function public.assign_founder(uuid, text, text, boolean) to service_role;

-- The founding_dad badge goes to founders only.
create or replace function public.award_founding_badge_on_link()
returns trigger language plpgsql security definer set search_path to 'public', 'pg_temp' as $fn$
begin
  if new.user_id is not null and new.founding and new.status in ('active', 'past_due') then
    insert into public.member_badges (user_id, badge_slug)
    values (new.user_id, 'founding_dad')
    on conflict do nothing;
  end if;
  return new;
end;
$fn$;

create or replace function public.award_founding_badge()
returns trigger language plpgsql security definer set search_path to '' as $fn$
begin
  if exists (select 1 from public.founding_members f where f.user_id = new.user_id and f.founding) then
    insert into public.member_badges (user_id, badge_slug)
    values (new.user_id, 'founding_dad')
    on conflict do nothing;
  end if;
  return new;
end;
$fn$;

-- Verify: every existing row is a founder, the cap is gone, members cannot call the function.
select founding, count(*) from public.founding_members group by founding;
select pg_get_constraintdef(oid) from pg_constraint where conname = 'founding_members_founder_number_check';
select has_function_privilege('authenticated', 'public.assign_founder(uuid, text, text, boolean)', 'execute') as members_can_call;
