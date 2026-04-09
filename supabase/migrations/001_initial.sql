-- XPS Intelligence Command Center — Initial Supabase Schema
-- Migration: 001_initial
-- Auth is scaffolded but disabled for dev (DEV_AUTH=true bypasses all RLS for now)

-- ── Enable extensions ──────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Users / Profiles ──────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  email        text,
  full_name    text,
  role         text not null default 'operator',
  avatar_url   text,
  last_seen_at timestamptz default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ── Runtime Settings ──────────────────────────────────────────────────────────
create table if not exists public.runtime_settings (
  id         uuid primary key default uuid_generate_v4(),
  key        text not null unique,
  value      text,
  encrypted  boolean not null default false,
  category   text not null default 'general',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seed safe defaults (no secrets)
insert into public.runtime_settings (key, value, category) values
  ('runtime_mode',     'synthetic', 'system'),
  ('dev_auth',         'true',      'auth'),
  ('default_agent',    'orchestrator', 'agents'),
  ('default_panel',    'dashboard', 'workspace')
on conflict (key) do nothing;

-- ── Connectors ────────────────────────────────────────────────────────────────
create table if not exists public.connectors (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  type        text not null,             -- 'crm' | 'email' | 'analytics' | 'storage' | 'llm' | 'webhook'
  status      text not null default 'not_connected', -- 'connected' | 'not_connected' | 'awaiting_config' | 'error'
  config      jsonb not null default '{}',
  last_sync   timestamptz,
  error_msg   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Agent Runs ────────────────────────────────────────────────────────────────
create table if not exists public.agent_runs (
  id            uuid primary key default uuid_generate_v4(),
  agent         text not null,           -- 'orchestrator' | 'research' | 'scraper' | 'bytebot' | etc.
  task          text not null,
  status        text not null default 'queued', -- 'queued' | 'running' | 'complete' | 'cancelled' | 'error'
  progress      integer not null default 0,     -- 0–100
  result        text,
  error_msg     text,
  context       jsonb not null default '{}',
  steps         jsonb not null default '[]',
  mode          text not null default 'synthetic', -- 'live' | 'synthetic' | 'local'
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- ── Agent Logs ────────────────────────────────────────────────────────────────
create table if not exists public.agent_logs (
  id         bigserial primary key,
  run_id     uuid references public.agent_runs on delete cascade,
  level      text not null default 'info',  -- 'debug' | 'info' | 'warn' | 'error'
  message    text not null,
  data       jsonb,
  created_at timestamptz not null default now()
);
create index if not exists agent_logs_run_id_idx on public.agent_logs(run_id);
create index if not exists agent_logs_created_at_idx on public.agent_logs(created_at desc);

-- ── Workspace Panels ──────────────────────────────────────────────────────────
create table if not exists public.workspace_panels (
  id         uuid primary key default uuid_generate_v4(),
  panel_type text not null,   -- 'dashboard' | 'workspace' | 'bytebot' | etc.
  title      text,
  content    jsonb not null default '{}',
  layout     jsonb not null default '{}',
  is_pinned  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Artifacts ─────────────────────────────────────────────────────────────────
create table if not exists public.artifacts (
  id           uuid primary key default uuid_generate_v4(),
  type         text not null,           -- 'code' | 'image' | 'report' | 'data' | 'scrape' | 'search'
  title        text,
  content      text,
  content_json jsonb,
  agent        text,
  run_id       uuid references public.agent_runs on delete set null,
  meta         jsonb not null default '{}',
  created_at   timestamptz not null default now()
);
create index if not exists artifacts_type_idx on public.artifacts(type);
create index if not exists artifacts_created_at_idx on public.artifacts(created_at desc);

-- ── Prompts ───────────────────────────────────────────────────────────────────
create table if not exists public.prompts (
  id          uuid primary key default uuid_generate_v4(),
  title       text not null,
  content     text not null,
  agent       text,
  category    text not null default 'general',
  tags        text[] not null default '{}',
  is_system   boolean not null default false,
  use_count   integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── Scrape Jobs ───────────────────────────────────────────────────────────────
create table if not exists public.scrape_jobs (
  id           uuid primary key default uuid_generate_v4(),
  url          text not null,
  prompt       text,
  status       text not null default 'pending', -- 'pending' | 'running' | 'complete' | 'error'
  result       text,
  raw_content  text,
  error_msg    text,
  mode         text not null default 'synthetic',
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists scrape_jobs_status_idx on public.scrape_jobs(status);

-- ── Search Jobs ───────────────────────────────────────────────────────────────
create table if not exists public.search_jobs (
  id           uuid primary key default uuid_generate_v4(),
  query        text not null,
  context      text,
  status       text not null default 'pending',
  summary      text,
  sources      jsonb not null default '[]',
  mode         text not null default 'synthetic',
  created_at   timestamptz not null default now(),
  completed_at timestamptz
);

-- ── Generated Outputs ─────────────────────────────────────────────────────────
create table if not exists public.generated_outputs (
  id         uuid primary key default uuid_generate_v4(),
  type       text not null,     -- 'text' | 'code' | 'json' | 'html' | 'markdown' | 'image_url'
  prompt     text,
  content    text not null,
  agent      text,
  model      text,
  tokens     integer,
  meta       jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists generated_outputs_type_idx on public.generated_outputs(type);
create index if not exists generated_outputs_created_at_idx on public.generated_outputs(created_at desc);

-- ── Chart Snapshots ───────────────────────────────────────────────────────────
create table if not exists public.chart_snapshots (
  id           uuid primary key default uuid_generate_v4(),
  chart_type   text not null,      -- 'line' | 'bar' | 'donut' | 'area'
  title        text,
  data         jsonb not null default '[]',
  config       jsonb not null default '{}',
  panel        text,
  created_at   timestamptz not null default now()
);

-- ── Control Plane Actions ─────────────────────────────────────────────────────
create table if not exists public.control_plane_actions (
  id         bigserial primary key,
  action     text not null,
  payload    jsonb not null default '{}',
  result     jsonb,
  status     text not null default 'pending',
  actor      text not null default 'operator',
  created_at timestamptz not null default now()
);
create index if not exists cpa_created_at_idx on public.control_plane_actions(created_at desc);

-- ── Health Checks ─────────────────────────────────────────────────────────────
create table if not exists public.health_checks (
  id         bigserial primary key,
  service    text not null,
  status     text not null,   -- 'ok' | 'degraded' | 'down'
  latency_ms integer,
  details    jsonb,
  checked_at timestamptz not null default now()
);
create index if not exists health_checks_service_idx on public.health_checks(service);
create index if not exists health_checks_checked_at_idx on public.health_checks(checked_at desc);

-- ── Row Level Security (scaffolded but permissive for dev) ────────────────────
-- NOTE: RLS is enabled but policies are permissive during dev (DEV_AUTH=true).
-- Tighten policies before production by replacing the permissive policies
-- with auth.uid()-based ones.

alter table public.profiles           enable row level security;
alter table public.runtime_settings   enable row level security;
alter table public.connectors         enable row level security;
alter table public.agent_runs         enable row level security;
alter table public.agent_logs         enable row level security;
alter table public.workspace_panels   enable row level security;
alter table public.artifacts          enable row level security;
alter table public.prompts            enable row level security;
alter table public.scrape_jobs        enable row level security;
alter table public.search_jobs        enable row level security;
alter table public.generated_outputs  enable row level security;
alter table public.chart_snapshots    enable row level security;
alter table public.control_plane_actions enable row level security;
alter table public.health_checks      enable row level security;

-- DEV: permissive policies (allow all authenticated + anon for dev mode)
-- TODO: replace with proper auth.uid() policies before going to production

do $$
declare
  tbl text;
  tbls text[] := array[
    'profiles','runtime_settings','connectors','agent_runs','agent_logs',
    'workspace_panels','artifacts','prompts','scrape_jobs','search_jobs',
    'generated_outputs','chart_snapshots','control_plane_actions','health_checks'
  ];
begin
  foreach tbl in array tbls loop
    execute format(
      'create policy "dev_allow_all" on public.%I for all using (true) with check (true)',
      tbl
    );
  end loop;
end $$;

-- ── Updated_at trigger ────────────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

do $$
declare
  tbl text;
  tbls text[] := array[
    'profiles','runtime_settings','connectors','workspace_panels','prompts'
  ];
begin
  foreach tbl in array tbls loop
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()',
      tbl
    );
  end loop;
end $$;
