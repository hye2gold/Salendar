-- Supabase schema bootstrap (Step 1)
-- Run this in Supabase SQL Editor or psql connected to your project.

-- user_profiles
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users on delete cascade,
  display_name text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now()
);

-- brands
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null,
  logo_url text,
  official_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- user_favorites
create table if not exists public.user_favorites (
  user_id uuid references auth.users on delete cascade,
  brand_id uuid references public.brands on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, brand_id)
);

-- events (optional: store AI-generated results)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands on delete cascade,
  title text not null,
  description text,
  start_date date,
  end_date date,
  category text,
  event_type text,
  source text,
  fetched_at timestamptz not null default now(),
  constraint events_unique_key unique (brand_id, title, start_date, end_date)
);

-- Enable RLS
alter table public.user_profiles enable row level security;
alter table public.brands enable row level security;
alter table public.user_favorites enable row level security;
alter table public.events enable row level security;

-- Helper to check admin role (defined after tables exist)
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1
    from public.user_profiles p
    where p.user_id = uid
      and p.role = 'admin'
  );
$$;

-- user_profiles policies
create policy user_profiles_self_select on public.user_profiles
  for select using (user_id = auth.uid() or is_admin(auth.uid()));
create policy user_profiles_self_upsert on public.user_profiles
  for insert with check (user_id = auth.uid());
create policy user_profiles_self_update on public.user_profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- brands policies
create policy brands_public_read on public.brands
  for select using (true);
create policy brands_admin_write on public.brands
  for all using (is_admin(auth.uid())) with check (is_admin(auth.uid()));

-- user_favorites policies
create policy favorites_owner_all on public.user_favorites
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- events policies
create policy events_public_read on public.events
  for select using (true);
create policy events_admin_or_service_write on public.events
  for all using (is_admin(auth.uid()) or auth.role() = 'service_role')
  with check (is_admin(auth.uid()) or auth.role() = 'service_role');

-- Indexes for quick lookup
create index if not exists idx_brands_category on public.brands(category);
create index if not exists idx_events_brand on public.events(brand_id);
create index if not exists idx_events_dates on public.events(start_date, end_date);
create index if not exists idx_favorites_user on public.user_favorites(user_id);
