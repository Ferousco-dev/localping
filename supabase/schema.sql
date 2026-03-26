create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  location text not null,
  admin_key text,
  created_at timestamptz default now()
);

create table if not exists sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  url text,
  enabled boolean default true,
  created_at timestamptz default now()
);

create table if not exists news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  content text not null,
  image text,
  source text not null,
  url text,
  location text default 'All',
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists news_cache (
  id text primary key,
  title text not null,
  description text,
  content text,
  image text,
  source text,
  url text,
  location text,
  published_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  source_id uuid references sources(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, source_id)
);

create table if not exists likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  news_id text not null,
  created_at timestamptz default now(),
  unique (user_id, news_id)
);

create table if not exists bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  news_id text not null,
  created_at timestamptz default now(),
  unique (user_id, news_id)
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  message text not null,
  type text check (type in ('source', 'admin')) default 'source',
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table sources enable row level security;
alter table news enable row level security;
alter table news_cache enable row level security;
alter table follows enable row level security;
alter table likes enable row level security;
alter table bookmarks enable row level security;
alter table notifications enable row level security;

create policy "Profiles are viewable by authenticated users" on profiles
  for select using (auth.role() = 'authenticated');

create policy "Profiles can insert own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Profiles can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Sources are viewable" on sources
  for select using (true);

create policy "Sources insert" on sources
  for insert with check (auth.role() = 'authenticated');

create policy "Sources delete" on sources
  for delete using (auth.role() = 'authenticated');

create policy "News is viewable" on news
  for select using (true);

create policy "News insert" on news
  for insert with check (auth.role() = 'authenticated');

create policy "News delete" on news
  for delete using (auth.role() = 'authenticated');

create policy "News cache is viewable" on news_cache
  for select using (true);

create policy "News cache insert" on news_cache
  for insert with check (true);

create policy "News cache update" on news_cache
  for update using (true);

create policy "Follows are owner-managed" on follows
  for select using (auth.uid() = user_id);

create policy "Follows insert" on follows
  for insert with check (auth.uid() = user_id);

create policy "Follows delete" on follows
  for delete using (auth.uid() = user_id);

create policy "Likes are owner-managed" on likes
  for select using (auth.uid() = user_id);

create policy "Likes insert" on likes
  for insert with check (auth.uid() = user_id);

create policy "Likes delete" on likes
  for delete using (auth.uid() = user_id);

create policy "Bookmarks are owner-managed" on bookmarks
  for select using (auth.uid() = user_id);

create policy "Bookmarks insert" on bookmarks
  for insert with check (auth.uid() = user_id);

create policy "Bookmarks delete" on bookmarks
  for delete using (auth.uid() = user_id);

create policy "Notifications are owner-readable" on notifications
  for select using (auth.uid() = user_id);

create policy "Notifications insert" on notifications
  for insert with check (auth.role() = 'authenticated');
