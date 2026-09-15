# Weslet — consumer app v2

Reels-style feed of pieces from Tunisian creators, plus search. Expo SDK 57, Expo Router, Supabase.

## Screens
- `app/(tabs)/index.tsx` — Pour vous: one piece per screen, swipe up. Like / share / add to bag on the right rail.
- `app/(tabs)/explore.tsx` — search + category chips + grid.
- `app/(tabs)/bag.tsx` — cart (persisted on device).
- `app/(tabs)/profile.tsx` — email magic-link sign-in via Supabase.
- `app/product/[id].tsx` — photos, variants, add to bag.

## Data
`lib/data.ts` reads `EXPO_PUBLIC_DATA_SOURCE`:
- `mock` (default) — 12 draft pieces from `lib/mock.ts`, so the app runs today.
- `supabase` — reads `products` + `brands`. Column names live in one function (`rowToProduct`); adjust them to the real schema.

## Ship without a local setup
1. Create a GitHub repo, upload this folder (drag and drop everything except `node_modules`).
2. expo.dev → create a project named `weslet` → copy the project ID into `app.json` → `extra.eas.projectId`.
3. expo.dev → project → Settings → GitHub → connect the repo.
4. Builds → New build → platform Android, profile `preview` → you get an APK link to install on your phone.
5. Fill the Supabase URL and anon key in `eas.json` (`env` blocks), or in expo.dev → Environment variables.

## Add a reel video to a piece
Set `video_url` on the product (mp4, vertical, muted loop). Products without video show their cover photo.
