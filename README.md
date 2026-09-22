# Weslet — consumer app v2

Reels-style feed of pieces from Tunisian creators, plus search. Expo SDK 57, Expo Router, Supabase.

## Screens
- `app/(tabs)/index.tsx` — Pour vous: one piece per screen, swipe up. Like / share / add to bag on the right rail.
- `app/(tabs)/explore.tsx` — search + category chips + grid.
- `app/(tabs)/bag.tsx` — cart grouped by boutique (persisted on device), 7 DT delivery per boutique.
- `app/(tabs)/profile.tsx` — account: name/phone, saved delivery address, link to orders.
- `app/product/[id].tsx` — photos, variants, add to bag.
- `app/boutique/[id].tsx` — brand page: logo, city, Instagram, follow, all pieces.
- `app/favorites.tsx` — saved pieces (♡ or double-tap on a reel), with price-drop / sold-out hints.
- `app/sizes.tsx` — the buyer's sizes; "Ma taille" on the feed shows only pieces available in them.
- `app/auth.tsx` — sign-in: email → 6-digit code (Supabase OTP, same email template as the dashboard) → name/phone.
- `app/checkout.tsx` — delivery form (24 governorates), per-boutique summary, calls the `place_order` RPC once per boutique.
- `app/orders/index.tsx`, `app/orders/[id].tsx` — order history and tracking timeline (live via Supabase realtime).

## Data
`lib/data.ts` reads `EXPO_PUBLIC_DATA_SOURCE`:
- `mock` (default) — 12 draft pieces from `lib/mock.ts`, so the app runs today.
- `supabase` — mapped to the real Weslet schema: `products` (title, price_millimes, images, stock_qty),
  `merchants`, `categories`, `product_variants` (optional), `orders`, `order_items`, `order_events`, `profiles`.
  Prices are converted millimes → dinars once, in `lib/data.ts`.

In mock mode, checkout still works: orders are saved on the device only, and no sign-in is required.
In supabase mode, checkout requires sign-in (the RPC checks `auth.uid()`).

## Environment variables
- `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY` — from Supabase → Project Settings → API.
- `EXPO_PUBLIC_DATA_SOURCE` — `mock` or `supabase`.
- `EXPO_PUBLIC_WEB_URL` — public address of the web app (e.g. `https://weslet.netlify.app`), used in shared links from Expo Go / native builds.
Set them on Netlify (Site configuration → Environment variables) and on expo.dev (Environment variables, Preview).

## Ship without a local setup
1. Create a GitHub repo, upload this folder (drag and drop everything except `node_modules`).
2. expo.dev → create a project named `weslet` → copy the project ID into `app.json` → `extra.eas.projectId`.
3. expo.dev → project → Settings → GitHub → connect the repo.
4. Builds → New build → platform Android, profile `preview` → you get an APK link to install on your phone.
5. Fill the Supabase URL and anon key in `eas.json` (`env` blocks), or in expo.dev → Environment variables.

## Add a reel video to a piece
Set `video_url` on the product (mp4, vertical, muted loop). Products without video show their cover photo.
