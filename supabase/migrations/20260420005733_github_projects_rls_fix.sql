-- Apply missing objects from 20260420120000_github_projects.sql
-- The table was pre-created manually so RLS policies, trigger, and indexes were never applied.

create index if not exists github_projects_user_id_idx on github_projects(user_id);
create index if not exists github_projects_created_at_idx on github_projects(created_at desc);

do $$ begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'github_projects_updated_at'
      and tgrelid = 'github_projects'::regclass
  ) then
    create trigger github_projects_updated_at
      before update on github_projects
      for each row execute function update_updated_at();
  end if;
end $$;

alter table github_projects enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'github_projects' and policyname = 'Users can view own github projects'
  ) then
    create policy "Users can view own github projects"
      on github_projects for select
      using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'github_projects' and policyname = 'Users can insert own github projects'
  ) then
    create policy "Users can insert own github projects"
      on github_projects for insert
      with check (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'github_projects' and policyname = 'Users can update own github projects'
  ) then
    create policy "Users can update own github projects"
      on github_projects for update
      using (auth.uid() = user_id);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'github_projects' and policyname = 'Users can delete own github projects'
  ) then
    create policy "Users can delete own github projects"
      on github_projects for delete
      using (auth.uid() = user_id);
  end if;
end $$;
