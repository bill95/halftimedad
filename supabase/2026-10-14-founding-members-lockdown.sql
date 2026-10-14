-- Phase 0 security fix. Run once in the Supabase SQL editor (project stfazjjdwdtkmjqcnphx).
--
-- The problem: the "own row update" policy plus a table-wide UPDATE grant let
-- any signed-in member update his own founding_members row, every column
-- included. A man who reserved a founder number, abandoned checkout, then
-- made a free account (the auth trigger links the row by email) could run
--
--   update founding_members set status = 'active' where user_id = auth.uid();
--
-- with the public anon key and get paid access without paying.
--
-- Nothing in the app writes this table with a member's session. Every write
-- goes through the service role (lib/supabase-admin.ts, api/waitlist,
-- api/settings/delete), which bypasses RLS and these grants, so this changes
-- no behavior for real users.

drop policy if exists "own row update" on public.founding_members;

revoke insert, update, delete on public.founding_members from authenticated, anon;

-- Verify: both queries should return zero rows.
select policyname from pg_policies
 where schemaname = 'public' and tablename = 'founding_members' and cmd <> 'SELECT';

select grantee, privilege_type from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'founding_members'
   and grantee in ('authenticated', 'anon') and privilege_type in ('INSERT', 'UPDATE', 'DELETE');
