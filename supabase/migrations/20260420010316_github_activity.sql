-- Stores the latest fetched activity for each connected GitHub project.
-- One row per project (upserted on each sync). raw_text is passed to the LLM in phase 4.
create table github_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  github_project_id uuid not null references github_projects(id) on delete cascade,
  source_type text not null check (source_type in ('release', 'prs', 'commits')),
  raw_text text not null,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint github_activity_project_unique unique (github_project_id)
);

create index github_activity_user_id_idx on github_activity(user_id);
create index github_activity_project_id_idx on github_activity(github_project_id);

create trigger github_activity_updated_at
  before update on github_activity
  for each row execute function update_updated_at();

alter table github_activity enable row level security;

create policy "Users can view own github activity"
  on github_activity for select
  using (auth.uid() = user_id);

create policy "Users can insert own github activity"
  on github_activity for insert
  with check (auth.uid() = user_id);

create policy "Users can update own github activity"
  on github_activity for update
  using (auth.uid() = user_id);

create policy "Users can delete own github activity"
  on github_activity for delete
  using (auth.uid() = user_id);
