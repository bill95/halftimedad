-- Free tools beyond The Script (first: What to Tell the Kids). Run in the
-- Supabase SQL editor BEFORE merging the free-tools PR. Only adds a table;
-- The Script keeps using script_trials and is untouched.
--
-- One row per use. No message or details text is stored, and no IP address:
-- `visitor` is an HMAC of the IP with a server secret, so it can be counted but
-- not reversed. Used for two limits in app/api/kids:
--   a few tries per visitor per 24 hours
--   a global daily cap, so a bot cannot run up the Anthropic bill
-- If this table is missing, the kids route fails closed (503). Nothing else breaks.

create table if not exists public.tool_trials (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  tool text not null,
  visitor text not null,
  variant_a text not null,
  variant_b text not null,
  input_chars integer not null,
  output_chars integer not null
);

create index if not exists tool_trials_tool_visitor_created on public.tool_trials (tool, visitor, created_at desc);
create index if not exists tool_trials_tool_created on public.tool_trials (tool, created_at desc);

-- Service role only.
alter table public.tool_trials enable row level security;
revoke all on public.tool_trials from anon, authenticated;

-- Verify: expect true, false.
select
  (select relrowsecurity from pg_class where oid = 'public.tool_trials'::regclass) as rls_on,
  has_table_privilege('anon', 'public.tool_trials', 'select') as anon_can_read;
