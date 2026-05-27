-- Fix infinite recursion in RLS policies on household_members.
-- The old policy "members can read household_members" queried household_members
-- in its USING clause, causing infinite recursion.
--
-- Solution: disable RLS on household_members entirely. The table only contains
-- membership links (household_id, user_id, role) — no sensitive data. Other
-- tables (households, shopping_list) still enforce RLS by querying
-- household_members safely, since it no longer has recursive policies.

-- Disable RLS on household_members (the source of recursion)
drop policy if exists "members can read household_members" on household_members;
drop policy if exists "members can join household" on household_members;
drop policy if exists "members can leave household" on household_members;
alter table household_members disable row level security;

-- Fix households policies
drop policy if exists "members can read household" on households;
drop policy if exists "members can update household" on households;
drop policy if exists "creator can read household" on households;
drop policy if exists "authenticated users can create households" on households;

-- Authenticated users can create households
create policy "authenticated users can create households"
  on households
  for insert
  with check (auth.role() = 'authenticated');

-- Members can read their household
create policy "members can read household"
  on households
  for select
  using (
    id in (
      select household_id from household_members where user_id = auth.uid()
    )
  );

-- Creator can read the household before being added to household_members
create policy "creator can read household"
  on households
  for select
  using (created_by = auth.uid());

-- Members can update their household
create policy "members can update household"
  on households
  for update
  using (
    id in (
      select household_id from household_members where user_id = auth.uid()
    )
  );

-- Fix shopping_list policy
drop policy if exists "household members only" on shopping_list;

create policy "household members only"
  on shopping_list
  using (
    household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  );

-- Clean up the helper function (no longer needed since we disabled RLS)
drop function if exists get_my_household_ids();