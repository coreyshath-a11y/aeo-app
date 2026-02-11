-- Profiles table: stores user metadata, tier, and preferences
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  company_name text,
  tier text not null default 'free' check (tier in ('free', 'monitor', 'diy', 'pro')),
  accepted_terms boolean not null default false,
  accepted_terms_at timestamptz,
  marketing_consent boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast lookups
create index idx_profiles_email on public.profiles(email);

-- RLS
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile (but not tier or id)
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, company_name, accepted_terms, accepted_terms_at, marketing_consent)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'company_name', ''),
    coalesce((new.raw_user_meta_data->>'accepted_terms')::boolean, false),
    case when (new.raw_user_meta_data->>'accepted_terms')::boolean = true then now() else null end,
    coalesce((new.raw_user_meta_data->>'marketing_consent')::boolean, true)
  );
  return new;
end;
$$;

-- Trigger on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated_at auto-update
create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

-- Update scans RLS: authenticated users can see their own scans (any status)
create policy "Authenticated users can read own scans"
  on public.scans for select
  using (auth.uid() = user_id);

-- Authenticated users can read results of their own scans
create policy "Authenticated users can read own scan results"
  on public.scan_results for select
  using (
    exists (
      select 1 from public.scans
      where scans.id = scan_results.scan_id
        and scans.user_id = auth.uid()
    )
  );
