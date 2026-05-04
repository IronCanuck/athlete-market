-- Athlete verification, multi-sport, portfolios, and "where they play" details

-- =========================================================================
-- ENUMS
-- =========================================================================
do $$ begin
  create type verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type athletic_division as enum (
    'NCAA_D1', 'NCAA_D2', 'NCAA_D3', 'NAIA', 'JUCO', 'HS', 'CLUB', 'PROFESSIONAL'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type portfolio_type as enum ('image', 'video', 'link', 'document');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_method as enum (
    'edu_email', 'roster_link', 'id_card', 'nil_letter', 'coach_reference'
  );
exception when duplicate_object then null; end $$;

-- =========================================================================
-- PROFILES additions
-- =========================================================================
alter table public.profiles
  add column if not exists verification_status verification_status not null default 'unverified',
  add column if not exists verified_at timestamptz,
  add column if not exists division athletic_division,
  add column if not exists conference text,
  add column if not exists team_name text,
  add column if not exists school_city text,
  add column if not exists school_state text,
  add column if not exists portfolio_count int default 0;

create index if not exists idx_profiles_verification on public.profiles(verification_status);
create index if not exists idx_profiles_division on public.profiles(division);

-- =========================================================================
-- ATHLETE_SPORTS (multi-sport support)
-- =========================================================================
create table if not exists public.athlete_sports (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  sport text not null,
  position text,
  is_primary boolean not null default false,
  jersey_number int,
  years_played int,
  created_at timestamptz default now(),
  unique (athlete_id, sport)
);
create index if not exists idx_athlete_sports_athlete on public.athlete_sports(athlete_id);
create index if not exists idx_athlete_sports_sport on public.athlete_sports(sport);

-- =========================================================================
-- PORTFOLIO_ITEMS
-- =========================================================================
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  type portfolio_type not null default 'image',
  url text not null,
  thumbnail_url text,
  title text,
  description text,
  position int default 0,
  created_at timestamptz default now()
);
create index if not exists idx_portfolio_athlete on public.portfolio_items(athlete_id);

-- =========================================================================
-- VERIFICATIONS (audit trail of submissions)
-- =========================================================================
create table if not exists public.verifications (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.profiles(id) on delete cascade,
  method verification_method not null,
  proof_url text,
  proof_data jsonb default '{}'::jsonb,
  status verification_status not null default 'pending',
  notes text,
  submitted_at timestamptz default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null
);
create index if not exists idx_verifications_athlete on public.verifications(athlete_id);
create index if not exists idx_verifications_status on public.verifications(status);

-- =========================================================================
-- TRIGGERS
-- =========================================================================
-- When a verification is set to 'verified' or 'rejected', mirror onto profile.
create or replace function public.sync_profile_verification()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'verified' then
    update public.profiles
       set verification_status = 'verified',
           verified_at = coalesce(new.reviewed_at, now())
     where id = new.athlete_id;
  elsif new.status = 'pending' then
    update public.profiles
       set verification_status = case
         when verification_status = 'verified' then verification_status
         else 'pending'
       end
     where id = new.athlete_id;
  elsif new.status = 'rejected' then
    update public.profiles
       set verification_status = 'rejected'
     where id = new.athlete_id
       and verification_status <> 'verified';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_verifications_sync on public.verifications;
create trigger trg_verifications_sync
  after insert or update on public.verifications
  for each row execute function public.sync_profile_verification();

-- Maintain portfolio_count denormalization
create or replace function public.refresh_portfolio_count()
returns trigger
language plpgsql
as $$
declare
  target_id uuid;
begin
  target_id := coalesce(new.athlete_id, old.athlete_id);
  update public.profiles p
     set portfolio_count = (
       select count(*) from public.portfolio_items where athlete_id = target_id
     )
   where p.id = target_id;
  return null;
end;
$$;

drop trigger if exists trg_portfolio_count on public.portfolio_items;
create trigger trg_portfolio_count
  after insert or delete on public.portfolio_items
  for each row execute function public.refresh_portfolio_count();

-- Replace handle_new_user to auto-verify .edu emails for athletes.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role user_role := coalesce((new.raw_user_meta_data->>'role')::user_role, 'buyer');
  v_full_name text := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_is_edu boolean := lower(new.email) ~ '\.edu$';
begin
  insert into public.profiles (id, full_name, role, verification_status, verified_at)
  values (
    new.id,
    v_full_name,
    v_role,
    case when v_role = 'athlete' and v_is_edu then 'verified'::verification_status
         else 'unverified'::verification_status end,
    case when v_role = 'athlete' and v_is_edu then now() else null end
  )
  on conflict (id) do nothing;

  if v_role = 'athlete' and v_is_edu then
    insert into public.verifications (
      athlete_id, method, proof_data, status, reviewed_at
    ) values (
      new.id,
      'edu_email',
      jsonb_build_object('email', new.email),
      'verified',
      now()
    );
  end if;

  return new;
end;
$$;

-- Block publishing a gig as 'active' unless the athlete is verified.
create or replace function public.enforce_verified_for_active_gig()
returns trigger
language plpgsql
as $$
declare
  v_status verification_status;
begin
  if new.status = 'active' then
    select verification_status into v_status from public.profiles where id = new.athlete_id;
    if v_status is distinct from 'verified' then
      raise exception 'Athlete must be verified before publishing a gig.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_gigs_require_verified on public.gigs;
create trigger trg_gigs_require_verified
  before insert or update of status on public.gigs
  for each row execute function public.enforce_verified_for_active_gig();

-- =========================================================================
-- ROW LEVEL SECURITY
-- =========================================================================
alter table public.athlete_sports  enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.verifications   enable row level security;

-- athlete_sports: public read; athlete writes own
drop policy if exists "athlete_sports_select_all" on public.athlete_sports;
create policy "athlete_sports_select_all" on public.athlete_sports for select using (true);

drop policy if exists "athlete_sports_modify_own" on public.athlete_sports;
create policy "athlete_sports_modify_own" on public.athlete_sports
  for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);

-- portfolio_items: public read; athlete writes own
drop policy if exists "portfolio_items_select_all" on public.portfolio_items;
create policy "portfolio_items_select_all" on public.portfolio_items for select using (true);

drop policy if exists "portfolio_items_modify_own" on public.portfolio_items;
create policy "portfolio_items_modify_own" on public.portfolio_items
  for all using (auth.uid() = athlete_id) with check (auth.uid() = athlete_id);

-- verifications: only the athlete (and admins) can see/insert their own.
drop policy if exists "verifications_select_own" on public.verifications;
create policy "verifications_select_own" on public.verifications for select
  using (auth.uid() = athlete_id
         or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "verifications_insert_own" on public.verifications;
create policy "verifications_insert_own" on public.verifications for insert
  with check (auth.uid() = athlete_id);

drop policy if exists "verifications_update_admin" on public.verifications;
create policy "verifications_update_admin" on public.verifications for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- =========================================================================
-- STORAGE BUCKETS + POLICIES
-- =========================================================================
insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('verification-docs', 'verification-docs', false)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = excluded.public;

-- portfolio: world-readable, owner-writable (path prefix = auth.uid())
drop policy if exists "portfolio_public_read" on storage.objects;
create policy "portfolio_public_read" on storage.objects for select
  using (bucket_id = 'portfolio');

drop policy if exists "portfolio_owner_write" on storage.objects;
create policy "portfolio_owner_write" on storage.objects for insert
  with check (
    bucket_id = 'portfolio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "portfolio_owner_update" on storage.objects;
create policy "portfolio_owner_update" on storage.objects for update
  using (
    bucket_id = 'portfolio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "portfolio_owner_delete" on storage.objects;
create policy "portfolio_owner_delete" on storage.objects for delete
  using (
    bucket_id = 'portfolio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- avatars: same pattern as portfolio
drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars_owner_write" on storage.objects;
create policy "avatars_owner_write" on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- verification-docs: only owner (and admins) can read/write
drop policy if exists "verification_docs_owner_read" on storage.objects;
create policy "verification_docs_owner_read" on storage.objects for select
  using (
    bucket_id = 'verification-docs'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
    )
  );

drop policy if exists "verification_docs_owner_write" on storage.objects;
create policy "verification_docs_owner_write" on storage.objects for insert
  with check (
    bucket_id = 'verification-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "verification_docs_owner_update" on storage.objects;
create policy "verification_docs_owner_update" on storage.objects for update
  using (
    bucket_id = 'verification-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "verification_docs_owner_delete" on storage.objects;
create policy "verification_docs_owner_delete" on storage.objects for delete
  using (
    bucket_id = 'verification-docs'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
