<<<<<<< HEAD
# BAMX Guadalajara — Food Bank App (checkpoint demo)

React Native (Expo Router) + Supabase. This checkpoint build shows the four
features required for the mid-point video:

| Requirement | Where |
| --- | --- |
| User signup | `src/app/(auth)/signup.tsx` |
| User login (right & wrong response) | `src/app/(auth)/login.tsx` |
| UI that requests data from backend and displays it | `src/app/(app)/home.tsx` (campaigns + my donations) |
| UI that saves data into backend | `src/app/(app)/donate.tsx` (new donation) |

## 1. Supabase setup (do this once)

1. Open your Supabase project → **SQL Editor** → **New query**.
2. Paste the whole contents of [`supabase/schema.sql`](./supabase/schema.sql) and click **Run**.
   This creates `profiles`, `campaigns`, `donations`, the signup trigger, RLS
   policies, and seeds a few campaigns.
3. **Turn OFF email confirmation** so signup logs in instantly during the demo:
   **Authentication → Sign In / Providers → Email → uncheck "Confirm email"** → Save.
   (With it on, a new account can't log in until the emailed link is clicked.)
4. Get your API values: **Project Settings → API** (or **Data API / API Keys**):
   - Project URL
   - the **anon** / **publishable** public key

## 2. Configure the app

Copy `.env.example` to `.env` and fill in the two values:

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-ANON-OR-PUBLISHABLE-KEY
```

## 3. Run

```bash
npx expo start
```

Press `i` for iOS simulator, `a` for Android, or scan the QR with Expo Go.
If you change `.env`, restart with `npx expo start --clear`.

## Suggested 2-minute demo script

1. **Signup** — open the app, tap "Regístrate gratis", pick a role (Donador),
   enter name/email/password, tap Registrarme → you land in the app.
2. **Login (wrong)** — log out ("Salir"), type a wrong password → red error
   "Correo o contraseña incorrectos".
3. **Login (right)** — enter the correct password → home screen loads.
4. **Read from backend** — home shows "Campañas activas" and "Mis donaciones"
   pulled from Supabase (pull to refresh to show it re-fetching).
5. **Save to backend** — tap "+ Nueva Donación", choose type/campaign/items,
   Confirmar → success alert → back on home the new donation appears in the list.
   (Optionally show the new row in the Supabase Table Editor.)

## Project structure

```
src/
  app/                 # Expo Router routes (screens)
    _layout.tsx        # auth provider + redirect between auth/app
    (auth)/            # login, signup
    (app)/             # home, donate
  components/          # shared UI (buttons, inputs, chips, brand)
  lib/
    supabase.ts        # Supabase client
    auth.tsx           # session + profile context
    db.ts              # all table queries (read/write)
  theme.ts             # BAMX design tokens
supabase/schema.sql    # run this in the Supabase SQL editor
```
=======
# BAMX
>>>>>>> 9e8b0b3ed63e2b529b5d3ba2a1abc00f365f32aa
