# Pocket: an expense tracker PWA

A mobile-first expense tracker you can install as a Progressive Web App, with Supabase for auth and data.
The visual direction comes from the *Expense Tracker – Fintech MVP* Dribbble shot: a pastel palette
(`#FFC4BB`, `#C0AFFF`, `#A3F3DD`, black, white), big rounded cards and colour-coded transactions.
The typography is new: **Plus Jakarta Sans** for UI text and **Space Grotesk** for figures and headlines.

## Features

- **Home**: welcome header, swipeable cards (balance / spent this month / earned this month), quick actions, colour-coded transactions
- **Transfer**: contact carousel, a big amount display, an on-screen keypad (your physical keyboard works too), and "Send money" with a balance check
- **Analytics**: weekly Expenses/Income bar chart with a tooltip, a category donut view, and week navigation
- **Savings goals**: create goals, add money (recorded as a *Savings* expense so your balance stays accurate), and track progress
- **All transactions**: search, filter, transactions grouped by day, and delete
- **Settings**: name, currency, card last 4, CSV export, install prompt, sign out
- **PWA**: installable and loads offline (Workbox service worker, self-hosted fonts)
- **Demo mode**: with no Supabase keys, the app runs on sample data stored in the browser

## Getting started

```bash
npm install
npm run dev
```

With no environment variables set, the app opens in **demo mode**.

## Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste [`supabase/schema.sql`](supabase/schema.sql) and run it. This creates the
   `profiles`, `transactions`, `contacts` and `savings_goals` tables, plus the `account_balance` view,
   row-level security policies and a trigger that creates a profile on sign-up.
3. Copy `.env.example` to `.env.local` and fill in the values from **Project Settings → API**:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
4. Under **Authentication → URL Configuration**, add your site URL (e.g. `http://localhost:5173` and your production domain).
5. Restart `npm run dev`. You'll get a sign-in / sign-up screen.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Type-check and production build (includes the service worker) |
| `npm run preview` | Serve the production build locally (use this to test install/offline) |

## Project layout

```
src/
  lib/          types, formatting, Supabase client, Supabase + local stores
  components/   cards, sheets, tab bar, icons
  pages/        Home, Transfer, Analytics, Transactions, Support, Settings, Login
  state.tsx     session (Supabase or demo) and shared app data
supabase/schema.sql
```

To change the fonts, edit `--font-ui` and `--font-num` at the top of `src/styles.css` and the two
`@fontsource-variable/*` imports in `src/main.tsx`.
