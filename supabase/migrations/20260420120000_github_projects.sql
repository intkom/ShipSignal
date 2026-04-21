-- GitHub repository connections (ShipSignal Phase 2 — URL storage only; no importer yet)
create table github_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  github_repo_url text not null,
  changelog_url text,
  documentation_url text,

  constraint github_projects_repo_url_not_empty check (char_length(trim(github_repo_url)) > 0),
  constraint github_projects_user_repo_unique unique (user_id, github_repo_url)
);

create index github_projects_user_id_idx on github_projects(user_id);
create index github_projects_created_at_idx on github_projects(created_at desc);

create trigger github_projects_updated_at
  before update on github_projects
  for each row execute function update_updated_at();

alter table github_projects enable row level security;

create policy "Users can view own github projects"
  on github_projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own github projects"
  on github_projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own github projects"
  on github_projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own github projects"
  on github_projects for delete
  using (auth.uid() = user_id);
