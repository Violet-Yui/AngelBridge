begin;

create table accounts (
  account_id text primary key,
  nickname text not null,
  nickname_key text not null unique,
  pin_salt text not null,
  pin_hash text not null,
  auth_token text not null unique,
  created_at timestamptz not null
);

create table match_pool_snapshot (
  state_key text primary key check (state_key = 'default'),
  snapshot_version integer not null check (snapshot_version = 1),
  snapshot jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

commit;
