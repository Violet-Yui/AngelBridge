begin;

alter table accounts
  add column personality_tags jsonb not null default '[]'::jsonb,
  add column pet_name text not null default '小天',
  add column avatar_url text,
  add column gender text check (gender in ('m', 'f')),
  add column birth_date date,
  add column city text;

commit;
