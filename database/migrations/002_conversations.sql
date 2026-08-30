begin;

create table conversations (
  session_id text not null,
  conversation_id text not null,
  match_id text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (session_id, conversation_id),
  unique (session_id, match_id),
  foreign key (session_id, match_id)
    references matches(session_id, match_id)
    on delete cascade
);

create table conversation_members (
  session_id text not null,
  conversation_id text not null,
  persona_id text not null,
  joined_at timestamptz not null,
  primary key (session_id, conversation_id, persona_id),
  foreign key (session_id, conversation_id)
    references conversations(session_id, conversation_id)
    on delete cascade,
  foreign key (session_id, persona_id)
    references personas(session_id, persona_id)
    on delete cascade
);

create table chat_messages (
  session_id text not null,
  conversation_id text not null,
  message_id text not null,
  sender_persona_id text not null,
  text text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null,
  is_synthetic boolean not null,
  primary key (session_id, message_id),
  foreign key (session_id, conversation_id)
    references conversations(session_id, conversation_id)
    on delete cascade,
  foreign key (session_id, sender_persona_id)
    references personas(session_id, persona_id)
    on delete cascade
);

create index conversations_by_updated_at
  on conversations(session_id, updated_at desc);

create index chat_messages_by_conversation
  on chat_messages(session_id, conversation_id, created_at, message_id);

commit;
