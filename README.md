# Duit

A mobile-first expense tracker in ringgit (RM), installable as a PWA, backed by Supabase.

The look started from the *Expense Tracker – Fintech MVP* Dribbble shot (pastel `#FFC4BB` / `#C0AFFF` / `#A3F3DD`,
big rounded shapes) and was redesigned around one question: **how much can I spend today?**

## What's in it

- **Safe to spend today.** Set a monthly budget and Duit spreads what's left evenly over the remaining days.
  A pace marker on the month bar shows whether you're spending faster than planned.
- **Three-tap entry.** The centre **+** opens a keypad. Type the amount, tap a category, save. Duit remembers
  your last category, the name defaults to the category, and Today/Yesterday are one tap each.
- **Undo, not "are you sure?".** Adding, deleting, sending and saving to goals all show a toast with Undo.
- **Insights.** Week or month view, a comparison against the same point last period, daily average,
  and a ranked category breakdown. Tap a category to see its transactions.
- **Savings goals.** Optional target date with the monthly amount needed, quick-add chips, and take money out again.
- **Send money.** Pick a contact, key in the amount, add an optional note. Duit records it (no real money moves).
- **Privacy mode.** The eye icon blurs every amount, for checking your budget in public.
- **Light, dark and auto themes.** Malay greetings by time of day, en-MY formatting, MYR by default.
- **PWA.** Installable, opens offline, self-hosted fonts (Plus Jakarta Sans + Space Grotesk).

## Hosting (no local setup needed)

The repo deploys itself to **GitHub Pages** through `.github/workflows/deploy.yml`:

1. In the repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Re-run the latest "Deploy to GitHub Pages" workflow (Actions tab), or push any commit.
3. The site appears at `https://<your-user>.github.io/<repo>/`. Open it on your phone and use "Add to Home Screen".

GitHub Pages on a **private** repo needs a paid GitHub plan. Otherwise make the repo public, or import it into
Vercel or Netlify (build command `npm run build`, output folder `dist`).

Without Supabase settings the site runs in **demo mode** with sample data stored in the browser.

## Connecting Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor** → paste [`supabase/schema.sql`](supabase/schema.sql) → Run. It creates the tables,
   the balance view, row-level security, and a trigger that creates a profile on sign-up. It's safe to re-run,
   and it upgrades databases created from the earlier version.
3. **Authentication → URL Configuration**: set the Site URL to your Pages URL.
4. In GitHub: **Settings → Secrets and variables → Actions → Variables**, add
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (from Supabase → Project Settings → API).
   The anon key is designed to be public; row-level security protects the data.
5. Re-run the deploy workflow. The site now shows a sign-in screen.

## Scripts (only if you do want to run it locally)

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Type-check and build the PWA into `dist/` |
| `npm run build:demo` | Single-file demo build (`dist-artifact/duit.html`) for embedding |

## Project layout

```
src/
  lib/          types, money/date formatting, budget maths, Supabase + local stores
  components/   entry sheet, keypad, budget hero, transaction rows, goal sheets, tab bar
  pages/        Home, Insights, Goals, Me, Transfer, Transactions, Login
  state.tsx     session (Supabase or demo) and shared data
  ui.tsx        toasts with undo, privacy mode, theme, entry-sheet control
supabase/schema.sql
.github/workflows/deploy.yml
```
