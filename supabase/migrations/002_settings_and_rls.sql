-- Add preferred supermarket chain to households
alter table households
  add column preferred_chain text;

-- Add unique constraint for gov_prices upsert keyed on (barcode, chain_id)
alter table gov_prices
  add constraint gov_prices_barcode_chain_key unique (barcode, chain_id);

-- Enable RLS on remaining tables
alter table households enable row level security;
alter table household_members enable row level security;
alter table articles enable row level security;

-- Members can read their household
create policy "members can read household"
  on households
  for select
  using (
    id in (
      select household_id from household_members
      where user_id = auth.uid()
    )
  );

-- Members can update their household
create policy "members can update household"
  on households
  for update
  using (
    id in (
      select household_id from household_members
      where user_id = auth.uid()
    )
  );

-- Members can see household members
create policy "members can read household_members"
  on household_members
  for select
  using (
    household_id in (
      select household_id from household_members
      where user_id = auth.uid()
    )
  );

-- Anyone can read articles (public catalog)
create policy "anyone can read articles"
  on articles
  for select
  using (true);

-- Authenticated users can create articles
create policy "authenticated users can create articles"
  on articles
  for insert
  with check (auth.role() = 'authenticated');

-- Anyone can read prices (public data)
alter table gov_prices enable row level security;
create policy "anyone can read prices"
  on gov_prices
  for select
  using (true);