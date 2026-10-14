-- Founder numbers at payment. Run in the Supabase SQL editor BEFORE merging
-- the PR that ships it (the new code calls public.assign_founder). Safe to run
-- while the old code is live: it only adds things.
--
-- Before: the homepage form inserted a founding_members row on submit, and the
-- row's founder_number (the primary key) was the founder number. Abandoned
-- checkouts kept their numbers, so the hundred leaked.
--
-- After: the form writes a founding_reservations row with no number. The Stripe
-- webhook (and /welcome, whichever lands first) calls assign_founder once
-- payment clears. That inserts the founding_members row with the next number,
-- so founding_members is purely a record of people who paid.
--
-- Existing founding_members rows are not touched.
--
-- If the SQL editor splits on semicolons inside the function, run the
-- CREATE FUNCTION statement on its own (it uses $fn$ delimiters for that).

create table if not exists public.founding_reservations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text not null unique,
  first_name text not null,
  challenge text,
  plan_interest text not null check (plan_interest in ('monthly', 'annual')),
  -- Secret the browser presents at checkout. Rotated on every resubmit.
  referral_code text not null unique,
  referred_by text,
  status text not null default 'reserved' check (status in ('reserved', 'checkout_pending', 'converted')),
  -- Signed-in account at checkout time, if any. Wins over email matching.
  user_id uuid references auth.users (id) on delete set null,
  founder_number bigint references public.founding_members (founder_number) on delete set null,
  converted_at timestamptz
);

-- Service role only. No policies means no access for anon or authenticated.
alter table public.founding_reservations enable row level security;
revoke all on public.founding_reservations from anon, authenticated;

create or replace function public.assign_founder(
  p_reservation uuid,
  p_customer text,
  p_subscription text
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
  -- Serialize: the webhook and /welcome can both get here for one checkout.
  select * into r from public.founding_reservations where id = p_reservation for update;
  if not found then
    raise exception 'reservation % not found', p_reservation;
  end if;

  if r.status = 'converted' and r.founder_number is not null then
    return r.founder_number;
  end if;

  -- A returning member (cancelled, then rejoined) keeps his original number.
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
    -- One number at a time across concurrent payments.
    perform pg_advisory_xact_lock(hashtext('founding_members.founder_number'));
    select coalesce(max(founder_number), 0) + 1 into next_number from public.founding_members;
    -- founder_number is GENERATED ALWAYS AS IDENTITY, but its sequence also
    -- advanced for every abandoned reservation under the old flow. Numbering
    -- from max + 1 keeps the founder numbers contiguous; the advisory lock
    -- above makes that safe. The check constraint (1 to 100) raises if full.
    insert into public.founding_members (
      founder_number, first_name, email, challenge, plan_interest, referral_code,
      referred_by, status, stripe_customer_id, stripe_subscription_id, activated_at, user_id
    ) overriding system value values (
      next_number, r.first_name, lower(r.email), r.challenge, r.plan_interest, r.referral_code,
      r.referred_by, 'active', p_customer, p_subscription, now(), r.user_id
    );
  end if;

  update public.founding_reservations
     set status = 'converted', founder_number = next_number, converted_at = now(), updated_at = now()
   where id = r.id;

  return next_number;
end;
$fn$;

revoke all on function public.assign_founder(uuid, text, text) from public, anon, authenticated;
grant execute on function public.assign_founder(uuid, text, text) to service_role;

-- Verify: the table exists with RLS on, and members cannot call the function.
select relname, relrowsecurity from pg_class where oid = 'public.founding_reservations'::regclass;
select has_function_privilege('authenticated', 'public.assign_founder(uuid, text, text)', 'execute') as members_can_call;
