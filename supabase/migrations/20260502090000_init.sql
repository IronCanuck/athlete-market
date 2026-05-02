-- Athlete Market: initial schema
-- Marketplace for student-athlete gigs (Fiverr-style)

create extension if not exists "pgcrypto";

-- =========================================================================
-- ENUMS
-- =========================================================================
do $$ begin
  create type user_role as enum ('athlete', 'buyer', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gig_status as enum ('draft', 'active', 'paused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type package_tier as enum ('basic', 'standard', 'premium');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum (
    'pending',      -- created by buyer, awaiting athlete acceptance
    'accepted',     -- athlete accepted, work in progress
    'delivered',    -- athlete marked delivered, awaiting buyer review
    'completed',    -- buyer accepted delivery
    'cancelled',    -- cancelled by either party
    'disputed'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type academic_year as enum ('freshman', 'sophomore', 'junior', 'senior', 'graduate');
exception when duplicate_object then null; end $$;

-- =========================================================================
-- PROFILES (1:1 with auth.users)
-- =========================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'buyer',
  full_name text,
  username text unique,
  avatar_url text,
  bio text,
  location text,
  -- Athlete-specific
  school text,
  sport text,
  position text,
  jersey_number int,
  academic_year academic_year,
  graduation_year int,
  nil_eligible boolean default false,
  social_instagram text,
  social_twitter text,
  social_tiktok text,
  rating numeric(3,2) default 0,
  total_reviews int default 0,
  total_earnings_cents bigint default 0,
  onboarding_completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_sport on public.profiles(sport);
create index if not exists idx_profiles_school on public.profiles(school);

-- =========================================================================
-- AVAILABILITY (athlete weekly schedule)
-- =========================================================================
create table if not exists public.availability (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  label text, -- e.g. "Free for content shoots"
  created_at timestamptz default now()
);
create index if not exists idx_availability_athlete on public.availability(athlete_id);

-- =========================================================================
-- CATEGORIES
-- =========================================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  icon text, -- lucide icon name
  position int default 0
);

-- =========================================================================
-- GIGS
-- =========================================================================
create table if not exists public.gigs (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  title text not null,
  slug text not null,
  description text,
  cover_image_url text,
  tags text[] default '{}',
  status gig_status not null default 'draft',
  views int default 0,
  rating numeric(3,2) default 0,
  total_reviews int default 0,
  total_orders int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (athlete_id, slug)
);

create index if not exists idx_gigs_athlete on public.gigs(athlete_id);
create index if not exists idx_gigs_category on public.gigs(category_id);
create index if not exists idx_gigs_status on public.gigs(status);

-- =========================================================================
-- GIG PACKAGES (basic / standard / premium)
-- =========================================================================
create table if not exists public.gig_packages (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  tier package_tier not null,
  title text not null,
  description text,
  price_cents int not null check (price_cents >= 500),
  delivery_days int not null check (delivery_days > 0),
  revisions int not null default 1,
  features text[] default '{}',
  unique (gig_id, tier)
);

-- =========================================================================
-- GIG IMAGES (gallery)
-- =========================================================================
create table if not exists public.gig_images (
  id uuid primary key default gen_random_uuid(),
  gig_id uuid not null references public.gigs(id) on delete cascade,
  url text not null,
  position int default 0
);

-- =========================================================================
-- ORDERS
-- =========================================================================
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  gig_id uuid not null references public.gigs(id) on delete cascade,
  package_id uuid not null references public.gig_packages(id) on delete restrict,
  status order_status not null default 'pending',
  requirements text,
  total_cents int not null,
  due_at timestamptz,
  delivered_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_orders_buyer on public.orders(buyer_id);
create index if not exists idx_orders_athlete on public.orders(athlete_id);
create index if not exists idx_orders_status on public.orders(status);

-- =========================================================================
-- MESSAGES (per order)
-- =========================================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  attachment_url text,
  read_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_messages_order on public.messages(order_id);

-- =========================================================================
-- REVIEWS
-- =========================================================================
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  gig_id uuid not null references public.gigs(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);
create index if not exists idx_reviews_athlete on public.reviews(athlete_id);
create index if not exists idx_reviews_gig on public.reviews(gig_id);

-- =========================================================================
-- FAVORITES
-- =========================================================================
create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  gig_id uuid not null references public.gigs(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, gig_id)
);

-- =========================================================================
-- TRIGGERS
-- =========================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'buyer')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Recompute athlete + gig rating after a review is inserted
create or replace function public.refresh_review_aggregates()
returns trigger
language plpgsql
as $$
begin
  update public.gigs g set
    rating = sub.avg_rating,
    total_reviews = sub.cnt
  from (
    select avg(rating)::numeric(3,2) as avg_rating, count(*) as cnt
    from public.reviews
    where gig_id = new.gig_id
  ) sub
  where g.id = new.gig_id;

  update public.profiles p set
    rating = sub.avg_rating,
    total_reviews = sub.cnt
  from (
    select avg(rating)::numeric(3,2) as avg_rating, count(*) as cnt
    from public.reviews
    where athlete_id = new.athlete_id
  ) sub
  where p.id = new.athlete_id;

  return new;
end;
$$;

drop trigger if exists trg_review_aggregates on public.reviews;
create trigger trg_review_aggregates
  after insert on public.reviews
  for each row execute function public.refresh_review_aggregates();

-- updated_at maintenance
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_gigs_touch on public.gigs;
create trigger trg_gigs_touch before update on public.gigs
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_orders_touch on public.orders;
create trigger trg_orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================
alter table public.profiles      enable row level security;
alter table public.availability  enable row level security;
alter table public.categories    enable row level security;
alter table public.gigs          enable row level security;
alter table public.gig_packages  enable row level security;
alter table public.gig_images    enable row level security;
alter table public.orders        enable row level security;
alter table public.messages      enable row level security;
alter table public.reviews       enable row level security;
alter table public.favorites     enable row level security;

-- profiles: anyone can read public profile data; user can update own row
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- availability: public read, athlete writes own
drop policy if exists "availability_select_all" on public.availability;
create policy "availability_select_all" on public.availability for select using (true);

drop policy if exists "availability_insert_own" on public.availability;
create policy "availability_insert_own" on public.availability for insert with check (auth.uid() = athlete_id);

drop policy if exists "availability_update_own" on public.availability;
create policy "availability_update_own" on public.availability for update using (auth.uid() = athlete_id);

drop policy if exists "availability_delete_own" on public.availability;
create policy "availability_delete_own" on public.availability for delete using (auth.uid() = athlete_id);

-- categories: public read; insert/update via service role only
drop policy if exists "categories_select_all" on public.categories;
create policy "categories_select_all" on public.categories for select using (true);

-- gigs: public read of active gigs; owner full access on own
drop policy if exists "gigs_select_active_or_own" on public.gigs;
create policy "gigs_select_active_or_own" on public.gigs for select using (
  status = 'active' or auth.uid() = athlete_id
);
drop policy if exists "gigs_insert_own" on public.gigs;
create policy "gigs_insert_own" on public.gigs for insert with check (auth.uid() = athlete_id);
drop policy if exists "gigs_update_own" on public.gigs;
create policy "gigs_update_own" on public.gigs for update using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);
drop policy if exists "gigs_delete_own" on public.gigs;
create policy "gigs_delete_own" on public.gigs for delete using (auth.uid() = athlete_id);

-- gig_packages: read public if parent gig active OR owned; write if gig owned
drop policy if exists "packages_select" on public.gig_packages;
create policy "packages_select" on public.gig_packages for select using (
  exists (select 1 from public.gigs g where g.id = gig_id and (g.status = 'active' or g.athlete_id = auth.uid()))
);
drop policy if exists "packages_modify_owner" on public.gig_packages;
create policy "packages_modify_owner" on public.gig_packages for all using (
  exists (select 1 from public.gigs g where g.id = gig_id and g.athlete_id = auth.uid())
) with check (
  exists (select 1 from public.gigs g where g.id = gig_id and g.athlete_id = auth.uid())
);

-- gig_images: same pattern as packages
drop policy if exists "gig_images_select" on public.gig_images;
create policy "gig_images_select" on public.gig_images for select using (
  exists (select 1 from public.gigs g where g.id = gig_id and (g.status = 'active' or g.athlete_id = auth.uid()))
);
drop policy if exists "gig_images_modify_owner" on public.gig_images;
create policy "gig_images_modify_owner" on public.gig_images for all using (
  exists (select 1 from public.gigs g where g.id = gig_id and g.athlete_id = auth.uid())
) with check (
  exists (select 1 from public.gigs g where g.id = gig_id and g.athlete_id = auth.uid())
);

-- orders: only buyer or athlete on the order can see it
drop policy if exists "orders_select_participants" on public.orders;
create policy "orders_select_participants" on public.orders for select using (
  auth.uid() = buyer_id or auth.uid() = athlete_id
);
drop policy if exists "orders_insert_buyer" on public.orders;
create policy "orders_insert_buyer" on public.orders for insert with check (auth.uid() = buyer_id);
drop policy if exists "orders_update_participants" on public.orders;
create policy "orders_update_participants" on public.orders for update using (
  auth.uid() = buyer_id or auth.uid() = athlete_id
);

-- messages: only order participants
drop policy if exists "messages_select_participants" on public.messages;
create policy "messages_select_participants" on public.messages for select using (
  exists (select 1 from public.orders o where o.id = order_id and (o.buyer_id = auth.uid() or o.athlete_id = auth.uid()))
);
drop policy if exists "messages_insert_participants" on public.messages;
create policy "messages_insert_participants" on public.messages for insert with check (
  sender_id = auth.uid()
  and exists (select 1 from public.orders o where o.id = order_id and (o.buyer_id = auth.uid() or o.athlete_id = auth.uid()))
);

-- reviews: anyone can read; only buyer of completed order can insert
drop policy if exists "reviews_select_all" on public.reviews;
create policy "reviews_select_all" on public.reviews for select using (true);
drop policy if exists "reviews_insert_buyer" on public.reviews;
create policy "reviews_insert_buyer" on public.reviews for insert with check (
  buyer_id = auth.uid()
  and exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid() and o.status = 'completed')
);

-- favorites: user manages own
drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own" on public.favorites for select using (auth.uid() = user_id);
drop policy if exists "favorites_modify_own" on public.favorites;
create policy "favorites_modify_own" on public.favorites for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
