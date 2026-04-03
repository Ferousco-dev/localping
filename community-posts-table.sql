-- SQL: Add community_posts table for direct community posts (no admin approval required)

create table if not exists community_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  content text not null,
  image text,
  location text,
  category text default 'general',
  author_id uuid references profiles(id) on delete set null,
  author_name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add indexes for faster queries
create index if not exists idx_community_posts_location on community_posts(location);
create index if not exists idx_community_posts_category on community_posts(category);
create index if not exists idx_community_posts_author_id on community_posts(author_id);
create index if not exists idx_community_posts_created_at on community_posts(created_at desc);

-- Enable RLS
alter table community_posts enable row level security;

-- RLS Policies
create policy "Community posts are viewable by all authenticated users" on community_posts
  for select using (auth.role() = 'authenticated');

create policy "Users can insert their own community posts" on community_posts
  for insert with check (auth.uid() = author_id);

create policy "Users can update their own community posts" on community_posts
  for update using (auth.uid() = author_id);

create policy "Users can delete their own community posts" on community_posts
  for delete using (auth.uid() = author_id);
