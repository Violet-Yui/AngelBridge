begin;

alter table accounts add column phone text;
create unique index accounts_phone_unique on accounts (phone) where phone is not null;
alter table accounts drop constraint if exists accounts_nickname_key_key;

create table sms_verification_codes (
  phone text primary key,
  purpose text not null check (purpose in ('register', 'login')),
  code_salt text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  next_send_at timestamptz not null,
  failed_attempts integer not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null
);

commit;
