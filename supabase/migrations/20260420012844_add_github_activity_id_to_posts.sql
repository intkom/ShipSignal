-- Link AI-generated post drafts back to the github_activity row that sourced them.
alter table posts
  add column if not exists github_activity_id uuid references github_activity(id) on delete set null;

create index if not exists posts_github_activity_id_idx on posts(github_activity_id);
