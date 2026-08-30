begin;

create table application_session_snapshots (
  session_id text primary key,
  snapshot_version integer not null check (snapshot_version = 1),
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

commit;
