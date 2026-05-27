-- Users are managed by Supabase Auth (auth.users)

-- Family groups — a user can belong to one household
create table households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  created_by  uuid references auth.users(id),
  created_at  timestamptz default now()
);

-- Membership: user ↔ household (many-to-many, typically one household per user)
create table household_members (
  household_id uuid references households(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade,
  role         text default 'member',  -- 'owner' | 'member'
  joined_at    timestamptz default now(),
  primary key (household_id, user_id)
);

-- Master article catalog (populated from NFC tags + Israeli price feed)
create table articles (
  id           uuid primary key default gen_random_uuid(),
  nfc_uid      text unique,            -- NFC tag UID or text payload
  barcode      text,                   -- EAN/UPC from gov price feed
  name_he      text not null,          -- Hebrew name
  name_en      text,                   -- English name (optional)
  category     text,                   -- e.g. 'dairy', 'produce', 'bakery'
  image_url    text,                   -- Supabase Storage URL
  unit         text default 'unit',    -- 'unit' | 'kg' | 'liter'
  updated_at   timestamptz default now()
);

-- Live shopping list — one row per article per household
create table shopping_list (
  id           uuid primary key default gen_random_uuid(),
  household_id uuid references households(id) on delete cascade,
  article_id   uuid references articles(id) on delete cascade,
  quantity     int not null default 1,
  added_by     uuid references auth.users(id),
  added_at     timestamptz default now(),
  checked      boolean default false,  -- strike-through when picked up
  unique (household_id, article_id)
);

-- Israeli government price data (refreshed daily)
create table gov_prices (
  id           uuid primary key default gen_random_uuid(),
  barcode      text not null,
  chain_id     text,                   -- retailer chain identifier
  chain_name   text,
  price        numeric(10,2),
  unit_qty     numeric,
  unit_type    text,
  fetched_at   timestamptz default now()
);

-- Row-Level Security (RLS)
alter table shopping_list enable row level security;

create policy "household members only"
  on shopping_list
  using (
    household_id in (
      select household_id from household_members
      where user_id = auth.uid()
    )
  );