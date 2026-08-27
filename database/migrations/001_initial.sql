begin;

create table demo_scenario_catalog (
  scenario_id text primary key,
  title text not null,
  summary text not null,
  dataset_version text not null,
  is_synthetic boolean not null default true
);

create table sessions (
  session_id text primary key,
  scenario_id text not null references demo_scenario_catalog(scenario_id),
  viewer_persona_id text not null,
  matching_mode text check (matching_mode in ('rule', 'fixture_ai', 'live_ai')),
  matching_attempted_at timestamptz,
  selected_match_id text,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table personas (
  session_id text not null references sessions(session_id) on delete cascade,
  persona_id text not null,
  display_name text not null,
  source_text text not null,
  accepted_exchange_modes jsonb not null,
  constraints jsonb not null,
  disclosure_policy jsonb not null,
  tree_disclosure text not null,
  primary key (session_id, persona_id)
);

create table value_nodes (
  session_id text not null,
  persona_id text not null,
  node_id text not null,
  direction text not null check (direction in ('offer', 'need', 'goal')),
  domain text not null,
  title text not null,
  description text not null,
  keywords jsonb not null,
  deliverables jsonb not null,
  visibility text not null check (visibility in ('private', 'match_only', 'mutual_consent')),
  evidence_completeness numeric(5,4) not null,
  confirmed boolean not null default false,
  updated_at timestamptz not null,
  dataset_version text not null,
  is_synthetic boolean not null,
  primary key (session_id, node_id),
  foreign key (session_id, persona_id) references personas(session_id, persona_id) on delete cascade
);

create table intents (
  session_id text not null,
  persona_id text not null,
  status text not null check (status in ('draft', 'active', 'paused', 'closed')),
  offer_node_ids jsonb not null,
  need_node_ids jsonb not null,
  goal_node_ids jsonb not null,
  accepted_exchange_modes jsonb not null,
  constraints jsonb not null,
  primary key (session_id, persona_id),
  foreign key (session_id, persona_id) references personas(session_id, persona_id) on delete cascade
);

create table matches (
  session_id text not null references sessions(session_id) on delete cascade,
  match_id text not null,
  viewer_persona_id text not null,
  candidate_persona_id text not null,
  internal_score numeric(6,2) not null,
  proof jsonb not null,
  assessment jsonb,
  score_breakdown jsonb,
  primary key (session_id, match_id)
);

create table consents (
  session_id text not null,
  match_id text not null,
  state text not null check (state in ('pending', 'waiting_other', 'mutual_accepted', 'rejected')),
  decisions jsonb not null,
  primary key (session_id, match_id),
  foreign key (session_id, match_id) references matches(session_id, match_id) on delete cascade
);

create table bridge_pacts (
  session_id text not null,
  match_id text not null,
  pact_id text not null,
  status text not null check (status in ('draft', 'active', 'completed', 'exited')),
  party_ids jsonb not null,
  pact_payload jsonb not null,
  created_at timestamptz not null,
  activated_at timestamptz,
  completed_at timestamptz,
  exited_at timestamptz,
  primary key (session_id, pact_id),
  unique (session_id, match_id),
  foreign key (session_id, match_id) references matches(session_id, match_id) on delete cascade
);

create table outcomes (
  session_id text not null references sessions(session_id) on delete cascade,
  outcome_id text not null,
  pact_id text not null,
  persona_id text not null,
  status text not null check (status in ('completed', 'exited')),
  summary text not null,
  tree_change text not null,
  created_at timestamptz not null,
  is_synthetic boolean not null,
  dataset_version text not null,
  primary key (session_id, outcome_id),
  foreign key (session_id, pact_id) references bridge_pacts(session_id, pact_id) on delete cascade
);

create table pet_conversation_turns (
  session_id text not null references sessions(session_id) on delete cascade,
  turn_id text not null,
  persona_id text not null,
  user_text text not null,
  assistant_text text not null,
  intent text not null check (intent in ('organize', 'explain_match', 'next_step')),
  related_match_id text,
  suggested_actions jsonb not null,
  created_at timestamptz not null,
  is_synthetic boolean not null,
  primary key (session_id, turn_id),
  foreign key (session_id, persona_id) references personas(session_id, persona_id) on delete cascade
);

create index matches_by_viewer on matches(session_id, viewer_persona_id, internal_score desc);
create index matches_by_candidate on matches(session_id, candidate_persona_id);
create index pet_turns_by_persona on pet_conversation_turns(session_id, persona_id, created_at);

alter table sessions
  add constraint sessions_selected_match_fk
  foreign key (session_id, selected_match_id)
  references matches(session_id, match_id);

commit;
