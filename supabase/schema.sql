create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  location text not null,
  admin_key text,
  auto_publish boolean default false,
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
  category text default 'general',
  news_type text not null default 'community' check (news_type in ('community', 'update')),
  community_kind text not null default 'post' check (community_kind in ('update', 'post')),
  status text not null default 'approved' check (status in ('pending', 'approved', 'rejected')),
  verified boolean default false,
  author_id uuid references profiles(id) on delete set null,
  author_name text,
  approved_by uuid references profiles(id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table news
  add column if not exists community_kind text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'news' and column_name = 'community_kind'
  ) then
    alter table news
      alter column community_kind set default 'post';
    alter table news
      alter column community_kind set not null;
    alter table news
      add constraint if not exists news_community_kind_check
        check (community_kind in ('update', 'post'));
  end if;
end $$;

update news
set community_kind = 'update', news_type = 'community'
where news_type = 'update' and (community_kind is null or community_kind = '');

update news
set community_kind = 'post'
where news_type = 'community' and (community_kind is null or community_kind = '');

create table if not exists flags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  news_id uuid references news(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, news_id)
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
alter table flags enable row level security;

create policy "Profiles are viewable by authenticated users" on profiles
  for select using (auth.role() = 'authenticated');

create policy "Profiles can insert own profile" on profiles
  for insert with check (auth.uid() = id);

create policy "Profiles can update own profile" on profiles
  for update using (auth.uid() = id);

create policy "Profiles admin update" on profiles
  for update using (
    exists (
      select 1 from profiles as p
      where p.id = auth.uid() and p.admin_key = 'LOCALPING-ADMIN'
    )
  );

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

create policy "News update" on news
  for update using (
    exists (
      select 1 from profiles as p
      where p.id = auth.uid() and p.admin_key = 'LOCALPING-ADMIN'
    )
  );

create policy "News delete" on news
  for delete using (auth.role() = 'authenticated');

create policy "Flags are owner-managed" on flags
  for select using (auth.uid() = user_id);

create policy "Flags insert" on flags
  for insert with check (auth.uid() = user_id);

create policy "Flags delete" on flags
  for delete using (auth.uid() = user_id);

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
