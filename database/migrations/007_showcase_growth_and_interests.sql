begin;

alter table accounts
  add column interest_tags jsonb not null default '[]'::jsonb,
  add column profile_intro text not null default '',
  add column account_kind text not null default 'real'
    check (account_kind in ('real', 'showcase')),
  add column pool_scope text not null default 'live'
    check (pool_scope in ('live', 'showcase')),
  add column growth_score integer not null default 100;

commit;
