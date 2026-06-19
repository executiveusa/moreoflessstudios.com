-- More-of-Less: Initial Schema Migration
-- Phase 1: Core tables for projects, assets, jobs, characters

-- Extended user profiles (linked to Supabase Auth)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  language text not null default 'en',
  budget_usd numeric not null default 5.00,
  monthly_spend_usd numeric not null default 0,
  preferences jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Projects (grouping for user work)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  name text not null,
  language text not null default 'en',
  metadata jsonb not null default '{}',
  total_cost_usd numeric not null default 0,
  status text not null default 'active' check (status in ('active', 'archived', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Assets (files stored in Cloudflare R2)
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  type text not null check (type in ('audio', 'video', 'image', 'character', 'stem')),
  r2_key text not null,
  filename text not null,
  mime_type text,
  size_bytes bigint,
  duration_sec numeric,
  metadata jsonb not null default '{}',
  consent jsonb not null default '{"voice_cloning": false, "likeness": false, "copyright_licensed": false}',
  created_at timestamptz not null default now()
);

-- Jobs (async processing queue)
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  type text not null check (type in (
    'audio_master', 'stem_sep', 'audio_analyze',
    'music_gen', 'video_gen', 'image_gen',
    'clip_extract', 'caption_gen'
  )),
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  input_asset_id uuid references public.assets,
  output_asset_id uuid references public.assets,
  params jsonb not null default '{}',
  result jsonb,
  cost_usd numeric not null default 0,
  provider text,
  progress integer not null default 0 check (progress between 0 and 100),
  error text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

-- Character passports (consistent AI characters across projects)
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  name text not null,
  appearance text,
  style_lora text,
  seed integer,
  voice_id text,
  continuity_rules jsonb not null default '[]',
  sample_asset_id uuid references public.assets,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Agent memory / knowledge graph entries
create table if not exists public.agent_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade not null,
  type text not null check (type in ('preference', 'style', 'project_insight', 'recommendation')),
  key text not null,
  value jsonb not null,
  confidence numeric not null default 0.5 check (confidence between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, type, key)
);

-- Events log (audit trail + analytics)
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles on delete cascade,
  job_id uuid references public.jobs on delete set null,
  event_type text not null,
  provider text,
  cost_usd numeric not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ──────────────────────────────────────────────
-- INDEXES
-- ──────────────────────────────────────────────
create index idx_projects_user_id on public.projects (user_id);
create index idx_assets_project_id on public.assets (project_id);
create index idx_assets_user_id on public.assets (user_id);
create index idx_jobs_project_id on public.jobs (project_id);
create index idx_jobs_user_id on public.jobs (user_id);
create index idx_jobs_status on public.jobs (status);
create index idx_characters_user_id on public.characters (user_id);
create index idx_agent_memory_user_id on public.agent_memory (user_id);
create index idx_events_user_id on public.events (user_id);
create index idx_events_created_at on public.events (created_at);

-- ──────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ──────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.assets enable row level security;
alter table public.jobs enable row level security;
alter table public.characters enable row level security;
alter table public.agent_memory enable row level security;
alter table public.events enable row level security;

-- Profiles: users access only their own
create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id);

-- Projects: users access only their own
create policy "projects_own" on public.projects
  for all using (auth.uid() = user_id);

-- Assets: users access only their own
create policy "assets_own" on public.assets
  for all using (auth.uid() = user_id);

-- Jobs: users access only their own
create policy "jobs_own" on public.jobs
  for all using (auth.uid() = user_id);

-- Characters: users access only their own
create policy "characters_own" on public.characters
  for all using (auth.uid() = user_id);

-- Agent memory: users access only their own
create policy "memory_own" on public.agent_memory
  for all using (auth.uid() = user_id);

-- Events: users read only their own
create policy "events_own" on public.events
  for select using (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- TRIGGERS: auto-update updated_at
-- ──────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

create trigger characters_updated_at before update on public.characters
  for each row execute function public.set_updated_at();

create trigger memory_updated_at before update on public.agent_memory
  for each row execute function public.set_updated_at();

-- ──────────────────────────────────────────────
-- TRIGGER: auto-create profile on signup
-- ──────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ──────────────────────────────────────────────
-- REALTIME: enable for jobs (live status in browser)
-- ──────────────────────────────────────────────
-- Run in Supabase dashboard: Realtime > Tables > enable `jobs`
-- Or via API: alter publication supabase_realtime add table public.jobs;
