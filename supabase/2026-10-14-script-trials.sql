-- The Script on the homepage, before sign-in. Run in the Supabase SQL editor
-- BEFORE merging the Phase 1 PR. Only adds a table.
--
-- One row per anonymous rewrite. No message text is stored, and no IP address:
-- `visitor` is an HMAC of the IP with a server secret, so it can be counted but
-- not reversed. Used for two limits in app/api/script/try:
--   one free try per visitor per 24 hours
--   a global daily cap, so a bot cannot run up the Anthropic bill

create table if not exists public.script_trials (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  visitor text not null,
  channel text not null,
  outcome text not null,
  input_chars integer not null,
  output_chars integer not null
);

create index if not exists script_trials_visitor_created on public.script_trials (visitor, created_at desc);
create index if not exists script_trials_created on public.script_trials (created_at desc);

-- Service role only.
alter table public.script_trials enable row level security;
revoke all on public.script_trials from anon, authenticated;

-- Verify: expect true, false.
select
  (select relrowsecurity from pg_class where oid = 'public.script_trials'::regclass) as rls_on,
  has_table_privilege('anon', 'public.script_trials', 'select') as anon_can_read;
