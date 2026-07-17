create table if not exists public.founding_members (
  founder_number bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  first_name text not null,
  email text not null unique,
  challenge text,
  plan_interest text not null check (plan_interest in ('monthly','annual')),
  referral_code text not null unique,
  referred_by text,
  status text not null default 'interested' check (status in ('interested','checkout_pending','active','past_due','cancelled')),
  stripe_customer_id text,
  stripe_subscription_id text,
  activated_at timestamptz
);
alter table public.founding_members add column if not exists stripe_customer_id text;
alter table public.founding_members add column if not exists stripe_subscription_id text;
alter table public.founding_members add column if not exists activated_at timestamptz;
alter table public.founding_members drop constraint if exists founding_members_founder_number_check;
alter table public.founding_members add constraint founding_members_founder_number_check check (founder_number between 1 and 100);
alter table public.founding_members drop constraint if exists founding_members_status_check;
alter table public.founding_members add constraint founding_members_status_check check (status in ('interested','checkout_pending','active','past_due','cancelled'));
alter table public.founding_members enable row level security;

-- Keep browser-facing roles locked out. Only the protected server API may
-- create and update founding memberships.
revoke all on table public.founding_members from anon, authenticated;
revoke all on sequence public.founding_members_founder_number_seq from anon, authenticated;
grant select, insert, update on table public.founding_members to service_role;
grant usage, select on sequence public.founding_members_founder_number_seq to service_role;

create index if not exists founding_members_referral_code_idx on public.founding_members(referral_code);
create index if not exists founding_members_referred_by_idx on public.founding_members(referred_by);
create unique index if not exists founding_members_stripe_subscription_idx on public.founding_members(stripe_subscription_id) where stripe_subscription_id is not null;
-- No public policies: the server-only API writes with the service role key.
