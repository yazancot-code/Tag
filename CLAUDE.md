# Tag — Smart NFC Grocery List

Cross-platform mobile app for reading preprogrammed NFC tags to build and share a family grocery list. Tags encode article identifiers; the app resolves them against an online articles database and syncs the list in real time across all family members.

---

## Design Philosophy

> **Minimum clicks. Maximum clarity.**
> The app opens directly to the live shopping list with NFC scanning already active.
> No splash screens. No navigation menus. One screen does everything.

---

## Tech Stack

### Mobile (React Native / Expo)

| Package | Purpose |
|---|---|
| `react-native` + `expo` (managed + EAS Build) | Cross-platform app |
| `react-native-nfc-manager` | NFC tag reading |
| `@react-navigation/native-stack` | Screen navigation |
| `expo-haptics` | Haptic feedback on scan |
| `expo-auth-session` + `expo-web-browser` | Google OAuth flow |
| `@supabase/supabase-js` | Backend client (auth, DB, realtime) |
| `react-native-async-storage` | Persist auth session locally |
| `react-native-fast-image` | Cached article images |
| TypeScript | Type safety |

### Backend — Supabase (free tier)

| Feature | Supabase Service |
|---|---|
| PostgreSQL database | Supabase DB |
| Google OAuth login | Supabase Auth |
| Real-time list sync | Supabase Realtime (subscriptions) |
| Article images | Supabase Storage |
| Daily price scraper | Supabase Edge Functions (Deno) + pg_cron |
| Row-level security | Supabase RLS policies |

> **Why Supabase?** Free tier includes 500 MB DB, Auth with Google OAuth, Realtime WebSockets,
> Edge Functions, and Storage — everything needed with zero hosting cost.

---

## Database Schema

```sql
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
```

### Row-Level Security (RLS)

```sql
-- Users can only read/write their own household's shopping list
alter table shopping_list enable row level security;

create policy "household members only"
  on shopping_list
  using (
    household_id in (
      select household_id from household_members
      where user_id = auth.uid()
    )
  );
```

---

## Project Structure

```
Tag/
├── App.tsx                         — Root: auth gate → AppNavigator
├── app.json                        — Expo config (NFC entitlements, scheme)
├── supabase/
│   ├── functions/
│   │   └── scrape-prices/
│   │       └── index.ts            — Edge Function: fetch IL gov price XML daily
│   └── migrations/
│       └── 001_initial_schema.sql  — Full DB schema + RLS policies
├── src/
│   ├── lib/
│   │   └── supabase.ts             — Supabase client init (anon key, URL)
│   ├── auth/
│   │   ├── AuthScreen.tsx          — Google Sign-In screen (shown only if not logged in)
│   │   └── useAuth.ts              — Auth state hook (session, user, signIn, signOut)
│   ├── navigation/
│   │   └── AppNavigator.tsx        — Stack: HomeScreen (+ optional SettingsScreen)
│   ├── screens/
│   │   ├── HomeScreen.tsx          — MAIN SCREEN: live list + NFC scan, auto-starts
│   │   └── SettingsScreen.tsx      — Household management, invite link, sign out
│   ├── hooks/
│   │   ├── useShoppingList.ts      — Realtime subscription to shopping_list
│   │   ├── useNfcScanner.ts        — NFC scan loop with auto-restart
│   │   └── useHousehold.ts         — Current household, members
│   ├── services/
│   │   ├── nfc.ts                  — extractTagId(), extractTextPayload()
│   │   ├── articles.ts             — lookupArticleByNfcUid(), lookupByBarcode()
│   │   └── prices.ts               — getArticlePrices(barcode)
│   ├── components/
│   │   ├── ArticleListItem.tsx     — Row: image + name + qty controls + check-off + price
│   │   ├── ScanOverlay.tsx         — Bottom bar: scanning indicator / countdown / found banner
│   │   ├── EmptyList.tsx           — First-run prompt
│   │   └── HouseholdBadge.tsx      — Shows family name + member count in header
│   └── types/
│       └── index.ts                — Article, ShoppingItem, Household, HouseholdMember
└── assets/
    └── placeholder.png             — Fallback when article has no image
```

---

## Screens

### HomeScreen (the only screen users normally see)

```
┌─────────────────────────────────────┐
│  🛒 Tag          [Family ▾]  [⚙️]   │  ← household switcher + settings
├─────────────────────────────────────┤
│  [🥛 Milk         − 2 +  ✓  2.90₪] │
│  [🍞 Bread        − 1 +  ✓  6.50₪] │
│  [🧀 Cheese       − 1 +  ✓  14.9₪] │
│  ...                                │
├─────────────────────────────────────┤
│  ● Scanning… (8s)   [tap to pause]  │  ← ScanOverlay — always visible
└─────────────────────────────────────┘
```

**Behavior on app open:**
1. If not logged in → show AuthScreen (Google Sign-In)
2. If logged in → immediately show HomeScreen with current shopping list
3. NFC scan loop starts automatically (10 s window → 2 s pause → rescan)
4. Scanning a known tag → increment quantity if already in list, add if new
5. Scanning an unknown NFC UID → prompt to associate with article (first-time setup)
6. Real-time subscription keeps list in sync across all family devices instantly

**List item actions:**
- `−` / `+` — adjust quantity (debounced, synced to Supabase)
- `✓` — check off item (strikes through, moves to bottom); can uncheck
- Long-press → remove from list
- Price shown from latest gov_prices for the household's preferred chain

### AuthScreen

- Single "Sign in with Google" button
- No username/password — OAuth only (secure, no credentials stored in app)
- On first sign-in → prompt to create or join a household (enter invite code)

### SettingsScreen (gear icon)

- Household name
- Shareable invite link / code for family members
- List of members with their last-seen time
- Preferred supermarket chain (for price display)
- Sign out

---

## Real-Time Sync

```typescript
// useShoppingList.ts — subscribe to household list changes
const channel = supabase
  .channel(`list:${householdId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'shopping_list',
      filter: `household_id=eq.${householdId}`,
    },
    (payload) => {
      // INSERT / UPDATE / DELETE — update local state immediately
      dispatch({ type: payload.eventType, item: payload.new ?? payload.old });
    }
  )
  .subscribe();
```

All family members see changes **within ~200 ms** of any scan or quantity edit.

---

## Authentication Flow

```
App opens
  └── supabase.auth.getSession()
        ├── session valid → HomeScreen
        └── no session → AuthScreen
                └── Google OAuth (expo-auth-session)
                      └── supabase.auth.signInWithIdToken(googleIdToken)
                            └── new user? → HouseholdSetupScreen
                            └── existing user → HomeScreen
```

Google OAuth is configured in Supabase dashboard under Auth → Providers → Google.
Credentials are never stored in the app — only the Supabase JWT session token (in AsyncStorage).

---

## Backend: Israeli Price Feed

### Data Source

The Israeli Ministry of Economy publishes daily price files from all major supermarket chains under the Food Prices Transparency Law (חוק שקיפות מחירים).

- **Gov portal:** `https://www.gov.il/he/pages/cpfta_prices_regulations`
- **Data format:** XML files published by each chain to their own URLs; the gov site links to chain download pages
- **Key chains:** Shufersal, Rami Levy, Victory, Yeinot Bitan, Co-op, Mega, etc.

### Edge Function: `scrape-prices`

Runs daily at 03:00 IL time via `pg_cron`:

```typescript
// supabase/functions/scrape-prices/index.ts
// 1. Fetch chain index from gov.il or directly from chain XML endpoints
// 2. Parse XML (PriceFull / Stores / Promotions files)
// 3. Upsert into gov_prices table keyed on (barcode, chain_id)
// 4. Log run result to a scrape_log table

Deno.serve(async () => {
  const chains = await fetchChainList(); // from gov portal or hardcoded known URLs
  for (const chain of chains) {
    const xml = await fetch(chain.priceFileUrl).then(r => r.text());
    const items = parsePriceXml(xml); // barcode, price, unit
    await supabase.from('gov_prices').upsert(items, {
      onConflict: 'barcode,chain_id',
    });
  }
  return new Response('ok');
});
```

**pg_cron schedule** (set in Supabase SQL editor):
```sql
select cron.schedule(
  'daily-price-scrape',
  '0 1 * * *',  -- 03:00 Israel time = 01:00 UTC
  $$select net.http_post(
    url := 'https://<project>.supabase.co/functions/v1/scrape-prices',
    headers := '{"Authorization": "Bearer <service-role-key>"}'
  )$$
);
```

---

## UI / Graphics Guidelines

- **Color palette:** Clean white background, green accent (`#2E7D32`) for actions, amber for prices
- **Typography:** System font (SF Pro on iOS, Roboto on Android); article names in 17 pt medium
- **Article images:** 56×56 dp rounded squares from Supabase Storage; graceful fallback to category emoji
- **Scan overlay:** Pulsing green ring animation while scanning; haptic + green flash on tag found
- **Checked items:** Strikethrough + 50% opacity; auto-scroll to keep unchecked items on top
- **List transitions:** Smooth animated inserts/removes (react-native Animated or Reanimated)
- **Dark mode:** Respect system preference via `useColorScheme()`

---

## NFC Tag Format

Tags should be written with NDEF Text records. Two supported formats:

| Format | Example | Usage |
|---|---|---|
| Article UID | `tag:MILK_FULL_FAT_3` | Custom short IDs (fastest lookup) |
| Barcode | `barcode:7290000000001` | EAN-13 from product packaging |

On first scan of an unknown UID → user is prompted to name the article and optionally take a photo. This association is saved globally (not per household) so any family using the same tags benefits.

---

## Commands

```bash
# Dev
npx expo start                    # Expo dev server (Metro bundler)
npx expo run:android              # Build + run on Android device (NFC required)
npx expo run:ios                  # Build + run on iOS device (NFC required, not simulator)
npx tsc --noEmit                  # TypeScript type check

# Supabase
npx supabase start                # Local Supabase (Docker) for development
npx supabase db push              # Apply migrations to remote project
npx supabase functions deploy scrape-prices   # Deploy edge function
npx supabase gen types typescript --local > src/types/supabase.ts  # Regenerate DB types
```

---

## Environment Variables

```bash
# .env (never commit — use EAS Secrets for production builds)
EXPO_PUBLIC_SUPABASE_URL=https://<project-id>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_GOOGLE_CLIENT_ID=<google-oauth-client-id>

# For edge functions (set in Supabase dashboard → Edge Functions → Secrets)
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
GOV_PRICE_FEED_TOKEN=<token-if-needed>
```

---

## Building for NFC

Expo Go **does not support** `react-native-nfc-manager`. A development build is required:

- **Android:** `npx expo run:android` on a physical device with NFC
- **iOS:** `npx expo run:ios` on a physical device with NFC (not simulator) — requires Apple Developer account; NFC entitlement (`com.apple.developer.nfc.readersession.formats`) must be in `app.json`

### `app.json` NFC config

```json
{
  "expo": {
    "ios": {
      "entitlements": {
        "com.apple.developer.nfc.readersession.formats": ["NDEF"]
      },
      "infoPlist": {
        "NFCReaderUsageDescription": "Used to scan grocery tags"
      }
    },
    "android": {
      "permissions": ["android.permission.NFC"]
    }
  }
}
```

---

## Supabase Free Tier Limits

| Resource | Free Limit | Expected Usage |
|---|---|---|
| Database | 500 MB | ~10 MB (articles + list) |
| Auth | Unlimited users | Family = ~10 users |
| Realtime | 200 concurrent connections | ~10 connections |
| Edge Functions | 500K invocations/mo | 1/day = ~30/mo |
| Storage | 1 GB | Article images ~50 MB |

Well within free tier for a family app.

---

## Development Roadmap

| Phase | Feature | Status |
|---|---|---|
| 1 | Supabase project setup + schema + RLS | ✅ |
| 2 | Google OAuth + household create/join | ✅ |
| 3 | Real-time shopping list (read + write) | ✅ |
| 4 | NFC scan → article lookup → add to list | ✅ |
| 5 | Article image support + UI polish | ✅ |
| 6 | Israeli gov price feed edge function | ✅ |
| 7 | Price display in list + chain selector | ✅ |
| 8 | Check-off, clear completed, share list | ✅ |
