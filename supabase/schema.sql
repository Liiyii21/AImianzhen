create table if not exists public.service_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  collection text not null,
  source_page text not null,
  action_id text,
  status text default 'new',
  payload jsonb not null default '{}'::jsonb,
  context jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists service_records_user_page_idx
  on public.service_records (user_id, source_page, updated_at desc);

alter table public.service_records enable row level security;

drop policy if exists "Users can read their own records" on public.service_records;
create policy "Users can read their own records"
  on public.service_records for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own records" on public.service_records;
create policy "Users can create their own records"
  on public.service_records for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own records" on public.service_records;
create policy "Users can update their own records"
  on public.service_records for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.service_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  file_type text,
  file_size bigint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists service_files_user_idx
  on public.service_files (user_id, created_at desc);

alter table public.service_files enable row level security;

drop policy if exists "Users can read their own files" on public.service_files;
create policy "Users can read their own files"
  on public.service_files for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own files" on public.service_files;
create policy "Users can create their own files"
  on public.service_files for insert
  to authenticated
  with check (auth.uid() = user_id);
