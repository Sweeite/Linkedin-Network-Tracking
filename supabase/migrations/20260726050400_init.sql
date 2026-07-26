-- Enable once
create extension if not exists "pgcrypto";

create table people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  name text not null,
  role text,
  company text,
  stage text not null default 'Connected' check (stage in ('Connected','Conversing','Nurturing','Converted')),
  source text default 'LinkedIn outreach',
  connected_date date,
  last_contact_date date,
  conversation_depth text default 'single' check (conversation_depth in ('single','multi')),
  asked_what_i_do boolean default false,
  pain_point text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  date_posted date,
  title text,
  views integer default 0,
  likes integer default 0,
  comments integer default 0,
  shares integer default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table learning_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  entry_date date not null default current_date,
  source_type text default 'article' check (source_type in ('article','video','podcast','book','conversation','other')),
  title text not null,
  url text,
  takeaway text,
  tags text[] default '{}',
  created_at timestamptz default now()
);

create table content_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) default auth.uid(),
  prompt_question text not null,
  angle text,
  why_now text,
  source_refs jsonb default '{}', -- { "learning_log_ids": [...], "people_ids": [...] }
  status text default 'new' check (status in ('new','drafted','posted','dismissed')),
  linked_post_id uuid references posts(id),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table people enable row level security;
alter table posts enable row level security;
alter table learning_log enable row level security;
alter table content_ideas enable row level security;

create policy "owner full access" on people for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner full access" on posts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner full access" on learning_log for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner full access" on content_ideas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
