-- XPS Phase 4 — autonomy/staging/runtime ledger additions
-- Migration: 003_phase4_autonomy

-- ── Browser jobs ─────────────────────────────────────────────────────────────
create table if not exists public.browser_jobs (
  id           uuid primary key default uuid_generate_v4(),
  url          text not null,
  action       text not null default 'scrape',
  status       text not null default 'queued',
  mode         text not null default 'blocked',
  result       text,
  evidence     jsonb not null default '[]',
  run_id       uuid references public.agent_runs on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists browser_jobs_created_idx on public.browser_jobs(created_at desc);
alter table public.browser_jobs enable row level security;
create policy "dev_allow_all" on public.browser_jobs for all using (true) with check (true);
create trigger set_updated_at before update on public.browser_jobs
  for each row execute function public.set_updated_at();

-- ── Parallel run groups ──────────────────────────────────────────────────────
create table if not exists public.parallel_run_groups (
  id           uuid primary key default uuid_generate_v4(),
  title        text,
  job_ids      uuid[] not null default '{}',
  status       text not null default 'running',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  completed_at timestamptz
);
create index if not exists parallel_groups_created_idx on public.parallel_run_groups(created_at desc);
alter table public.parallel_run_groups enable row level security;
create policy "dev_allow_all" on public.parallel_run_groups for all using (true) with check (true);
create trigger set_updated_at before update on public.parallel_run_groups
  for each row execute function public.set_updated_at();

-- ── Page snapshots (browser evidence) ─────────────────────────────────────────
create table if not exists public.page_snapshots (
  id             uuid primary key default uuid_generate_v4(),
  job_id         uuid references public.browser_jobs on delete set null,
  url            text not null,
  snapshot_text  text,
  extracted_data jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists page_snapshots_created_idx on public.page_snapshots(created_at desc);
alter table public.page_snapshots enable row level security;
create policy "dev_allow_all" on public.page_snapshots for all using (true) with check (true);

-- ── Staging pipeline ─────────────────────────────────────────────────────────
create table if not exists public.pre_stage_items (
  id         uuid primary key default uuid_generate_v4(),
  run_id     uuid references public.agent_runs on delete set null,
  source     text not null default 'runtime',
  payload    jsonb not null default '{}',
  status     text not null default 'queued',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists pre_stage_created_idx on public.pre_stage_items(created_at desc);
alter table public.pre_stage_items enable row level security;
create policy "dev_allow_all" on public.pre_stage_items for all using (true) with check (true);
create trigger set_updated_at before update on public.pre_stage_items
  for each row execute function public.set_updated_at();

create table if not exists public.stage_items (
  id         uuid primary key default uuid_generate_v4(),
  run_id     uuid references public.agent_runs on delete set null,
  source     text not null default 'runtime',
  payload    jsonb not null default '{}',
  status     text not null default 'queued',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists stage_created_idx on public.stage_items(created_at desc);
alter table public.stage_items enable row level security;
create policy "dev_allow_all" on public.stage_items for all using (true) with check (true);
create trigger set_updated_at before update on public.stage_items
  for each row execute function public.set_updated_at();

-- ── Runtime ledger ───────────────────────────────────────────────────────────
create table if not exists public.runtime_ledgers (
  id         uuid primary key default uuid_generate_v4(),
  run_id     uuid references public.agent_runs on delete set null,
  entry_type text not null,
  payload    jsonb not null default '{}',
  status     text not null default 'recorded',
  created_at timestamptz not null default now()
);
create index if not exists runtime_ledgers_created_idx on public.runtime_ledgers(created_at desc);
alter table public.runtime_ledgers enable row level security;
create policy "dev_allow_all" on public.runtime_ledgers for all using (true) with check (true);

-- ── Recovery queue ───────────────────────────────────────────────────────────
create table if not exists public.recovery_queue (
  id          uuid primary key default uuid_generate_v4(),
  run_id      uuid references public.agent_runs on delete set null,
  action      text not null,
  payload     jsonb not null default '{}',
  status      text not null default 'queued',
  retry_count integer not null default 0,
  last_error  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists recovery_queue_created_idx on public.recovery_queue(created_at desc);
alter table public.recovery_queue enable row level security;
create policy "dev_allow_all" on public.recovery_queue for all using (true) with check (true);
create trigger set_updated_at before update on public.recovery_queue
  for each row execute function public.set_updated_at();

-- ── HubSpot export staging ───────────────────────────────────────────────────
create table if not exists public.hubspot_exports (
  id             uuid primary key default uuid_generate_v4(),
  run_id         uuid references public.agent_runs on delete set null,
  payload        jsonb not null default '{}',
  status         text not null default 'queued',
  blocked_reason text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  completed_at   timestamptz
);
create index if not exists hubspot_exports_created_idx on public.hubspot_exports(created_at desc);
alter table public.hubspot_exports enable row level security;
create policy "dev_allow_all" on public.hubspot_exports for all using (true) with check (true);
create trigger set_updated_at before update on public.hubspot_exports
  for each row execute function public.set_updated_at();

-- ── Airtable export staging ──────────────────────────────────────────────────
create table if not exists public.airtable_exports (
  id             uuid primary key default uuid_generate_v4(),
  run_id         uuid references public.agent_runs on delete set null,
  payload        jsonb not null default '{}',
  status         text not null default 'queued',
  blocked_reason text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  completed_at   timestamptz
);
create index if not exists airtable_exports_created_idx on public.airtable_exports(created_at desc);
alter table public.airtable_exports enable row level security;
create policy "dev_allow_all" on public.airtable_exports for all using (true) with check (true);
create trigger set_updated_at before update on public.airtable_exports
  for each row execute function public.set_updated_at();
