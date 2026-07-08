-- Database Initialization Migration for Aarogya (Idempotent / Re-runnable)

-- 1. Enable uuid-ossp extension
create extension if not exists "uuid-ossp";

-- 2. Profiles Table
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  height_cm int not null,
  weight_kg int not null,
  age int not null,
  sex text not null,
  diet text not null,
  activity text not null,
  targets jsonb not null,
  created_at timestamptz default now() not null
);

-- 3. Reports Table
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  uploaded_at timestamptz default now() not null,
  source_type text not null, -- 'pdf' or 'photo'
  storage_path text not null,
  parse_status text not null, -- 'pending', 'processing', 'completed', 'failed'
  consent_scope text not null
);

-- 4. Report Markers Table
create table if not exists public.report_markers (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports on delete cascade,
  marker_id text not null, -- e.g., 'iron', 'vitamin_d', 'hba1c'
  value numeric not null,
  unit text not null,
  range_low numeric not null,
  range_high numeric not null,
  range_source text not null,
  flag text, -- e.g., 'low', 'high', 'normal'
  verdict_class text not null, -- 'food_fixable', 'doctors_territory', 'both'
  confidence numeric not null
);

-- 5. Logs Table
create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  ts timestamptz default now() not null,
  type text not null, -- 'food', 'water', 'weight'
  raw_text text,
  channel text not null, -- 'text' or 'voice'
  parse jsonb not null,
  accepted_as_is boolean default true,
  correction jsonb
);

-- 6. Nudges Table
create table if not exists public.nudges (
  user_id uuid not null references auth.users on delete cascade,
  sent_on date default current_date not null,
  template_id text not null,
  opened boolean default false not null,
  primary key (user_id, sent_on)
);

-- ---- Enable Row-Level Security (RLS) ----
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.report_markers enable row level security;
alter table public.logs enable row level security;
alter table public.nudges enable row level security;

-- ---- RLS Policies ----

-- Profiles Policies
drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Reports Policies
drop policy if exists "Users can view their own reports" on public.reports;
create policy "Users can view their own reports"
  on public.reports for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own reports" on public.reports;
create policy "Users can insert their own reports"
  on public.reports for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own reports" on public.reports;
create policy "Users can delete their own reports"
  on public.reports for delete
  using (auth.uid() = user_id);

-- Report Markers Policies
drop policy if exists "Users can view markers from their own reports" on public.report_markers;
create policy "Users can view markers from their own reports"
  on public.report_markers for select
  using (
    report_id in (
      select id from public.reports where user_id = auth.uid()
    )
  );

drop policy if exists "Users can insert markers into their own reports" on public.report_markers;
create policy "Users can insert markers into their own reports"
  on public.report_markers for insert
  with check (
    report_id in (
      select id from public.reports where user_id = auth.uid()
    )
  );

-- Logs Policies
drop policy if exists "Users can view their own logs" on public.logs;
create policy "Users can view their own logs"
  on public.logs for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own logs" on public.logs;
create policy "Users can insert their own logs"
  on public.logs for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own logs" on public.logs;
create policy "Users can update their own logs"
  on public.logs for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete their own logs" on public.logs;
create policy "Users can delete their own logs"
  on public.logs for delete
  using (auth.uid() = user_id);

-- Nudges Policies
drop policy if exists "Users can view their own nudges" on public.nudges;
create policy "Users can view their own nudges"
  on public.nudges for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert/update their own nudges" on public.nudges;
create policy "Users can insert/update their own nudges"
  on public.nudges for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own nudges" on public.nudges;
create policy "Users can update their own nudges"
  on public.nudges for update
  using (auth.uid() = user_id);

-- ---- Storage bucket for report uploads (private; path-scoped by user id folder) ----
insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;

drop policy if exists "Users can access their own report files" on storage.objects;
create policy "Users can access their own report files"
  on storage.objects for all
  using (bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text);
