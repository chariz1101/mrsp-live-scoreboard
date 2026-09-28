-- Run this once in the Neon SQL Editor.

create table if not exists players (
  id         serial primary key,
  name       text not null,
  team       text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists runs (
  id         serial primary key,
  player_id  integer not null references players(id) on delete cascade,
  time_sec   numeric(8,2) not null default 0,
  drops      integer not null default 0,
  resets     integer not null default 0,
  dnf        boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists matches (
  id         serial primary key,
  a_id       integer not null references players(id) on delete cascade,
  b_id       integer not null references players(id) on delete cascade,
  winner_id  integer not null references players(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists runs_player_idx on runs (player_id);
create index if not exists matches_a_idx   on matches (a_id);
create index if not exists matches_b_idx   on matches (b_id);
