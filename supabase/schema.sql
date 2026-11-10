-- Duit expense tracker — Supabase schema
-- Run this in the Supabase dashboard → SQL Editor (or `supabase db push` as a migration).
-- Every table is protected by Row Level Security: users only ever see their own rows.

create extension if not exists pgcrypto;

-- ── Profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name       text not null default '',
  currency        text not null default 'MYR',
  monthly_budget  numeric(12, 2) check (monthly_budget is null or monthly_budget > 0),
  created_at      timestamptz not null default now()
);

-- ── Transactions ────────────────────────────────────────────────────────────
create table if not exists public.transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title        text not null check (char_length(title) between 1 and 80),
  amount       numeric(12, 2) not null check (amount > 0),
  kind         text not null check (kind in ('expense', 'income')),
  category     text not null default 'other',
  note         text,
  occurred_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
create index if not exists transactions_user_time_idx
  on public.transactions (user_id, occurred_at desc);

-- ── Contacts (people you send money to) ─────────────────────────────────────
create table if not exists public.contacts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  handle      text not null,
  tint        text not null default 'lilac',
  created_at  timestamptz not null default now(),
  unique (user_id, handle)
);

-- ── Savings goals ───────────────────────────────────────────────────────────
create table if not exists public.savings_goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null,
  target      numeric(12, 2) not null check (target > 0),
  saved       numeric(12, 2) not null default 0 check (saved >= 0),
  icon        text not null default 'petals',
  tint        text not null default 'lilac',
  deadline    date,
  created_at  timestamptz not null default now()
);

-- ── Upgrades for databases created from an earlier version of this file ─────
alter table public.profiles alter column currency set default 'MYR';
alter table public.profiles add column if not exists monthly_budget numeric(12, 2)
  check (monthly_budget is null or monthly_budget > 0);
alter table public.profiles drop column if exists card_last4;
alter table public.savings_goals add column if not exists deadline date;

-- ── Balance view (respects RLS of the caller) ───────────────────────────────
create or replace view public.account_balance
with (security_invoker = true) as
select
  user_id,
  coalesce(sum(case when kind = 'income' then amount else -amount end), 0)::numeric(14, 2) as balance
from public.transactions
group by user_id;

-- ── Row Level Security ──────────────────────────────────────────────────────
alter table public.profiles      enable row level security;
alter table public.transactions  enable row level security;
alter table public.contacts      enable row level security;
alter table public.savings_goals enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "own transactions" on public.transactions;
create policy "own transactions" on public.transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own contacts" on public.contacts;
create policy "own contacts" on public.contacts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "own goals" on public.savings_goals;
create policy "own goals" on public.savings_goals
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ── Create a profile automatically on sign-up ───────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
