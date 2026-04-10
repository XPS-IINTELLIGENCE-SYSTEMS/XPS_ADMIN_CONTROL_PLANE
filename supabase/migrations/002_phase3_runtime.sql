-- XPS Phase 3 — runtime/orchestration schema additions
-- Migration: 002_phase3_runtime

-- ── Workspace objects metadata ────────────────────────────────────────────────
-- Tracks workspace objects that have been persisted / published as artifacts
create table if not exists public.workspace_objects (
  id          uuid primary key default uuid_generate_v4(),
  ws_obj_id   text,             -- client-side genId() value
  type        text not null,    -- all OBJ_TYPE values including phase 3 new types
  title       text,
  content     text,
  agent       text,
  run_id      uuid references public.agent_runs on delete set null,
  status      text not null default 'done',
  meta        jsonb not null default '{}',
  steps       jsonb not null default '[]',
  progress    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists workspace_objects_type_idx    on public.workspace_objects(type);
create index if not exists workspace_objects_agent_idx   on public.workspace_objects(agent);
create index if not exists workspace_objects_run_id_idx  on public.workspace_objects(run_id);
create index if not exists workspace_objects_created_idx on public.workspace_objects(created_at desc);
alter table public.workspace_objects enable row level security;
create policy "dev_allow_all" on public.workspace_objects for all using (true) with check (true);
create trigger set_updated_at before update on public.workspace_objects
  for each row execute function public.set_updated_at();

-- ── Connector runtime state snapshots ────────────────────────────────────────
create table if not exists public.connector_snapshots (
  id           bigserial primary key,
  connectors   jsonb not null default '{}',   -- snapshot of connector_state()
  mode         text not null default 'synthetic',
  triggered_by text,                           -- 'auto' | 'operator' | 'run'
  created_at   timestamptz not null default now()
);
create index if not exists connector_snapshots_created_idx on public.connector_snapshots(created_at desc);
alter table public.connector_snapshots enable row level security;
create policy "dev_allow_all" on public.connector_snapshots for all using (true) with check (true);

-- ── Extend agent_runs with richer columns (safe adds) ────────────────────────
alter table public.agent_runs
  add column if not exists summary        text,
  add column if not exists artifacts      jsonb not null default '[]';

-- ── Add mode column to artifacts if missing ──────────────────────────────────
alter table public.artifacts
  add column if not exists run_mode text not null default 'synthetic';
