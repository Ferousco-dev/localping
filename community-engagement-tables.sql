-- SQL code to add comments, views, and likes system to community feed
-- Run this in your Supabase SQL editor

-- 1. COMMENTS TABLE - for community post comments
create table if not exists community_comments (
  id uuid primary key default gen_random_uuid(),
  news_id text not null,
  user_id uuid references profiles(id) on delete set null,
  author_name text not null,
  comment_text text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add index for faster queries
create index if not exists idx_community_comments_news_id on community_comments(news_id);
create index if not exists idx_community_comments_user_id on community_comments(user_id);
create index if not exists idx_community_comments_created_at on community_comments(created_at desc);

-- 2. VIEWS TABLE - track article views per user
create table if not exists community_views (
  id uuid primary key default gen_random_uuid(),
  news_id text not null,
  user_id uuid references profiles(id) on delete set null,
  viewed_at timestamptz default now(),
  unique (news_id, user_id)
);

-- Add index for faster queries
create index if not exists idx_community_views_news_id on community_views(news_id);
create index if not exists idx_community_views_user_id on community_views(user_id);

-- 3. COMMUNITY LIKES TABLE - for community post likes (separate from general likes)
create table if not exists community_likes (
  id uuid primary key default gen_random_uuid(),
  news_id text not null,
  user_id uuid references profiles(id) on delete set null,
  created_at timestamptz default now(),
  unique (news_id, user_id)
);

-- Add index for faster queries
create index if not exists idx_community_likes_news_id on community_likes(news_id);
create index if not exists idx_community_likes_user_id on community_likes(user_id);

-- ENABLE ROW LEVEL SECURITY
alter table community_comments enable row level security;
alter table community_views enable row level security;
alter table community_likes enable row level security;

-- ROW LEVEL SECURITY POLICIES

-- Community Comments Policies
create policy "Community comments are viewable by all authenticated users" on community_comments
  for select using (auth.role() = 'authenticated');

create policy "Users can insert their own comments" on community_comments
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "Users can update their own comments" on community_comments
  for update using (auth.uid() = user_id);

create policy "Users can delete their own comments" on community_comments
  for delete using (auth.uid() = user_id);

-- Community Views Policies
create policy "Community views are viewable by all authenticated users" on community_views
  for select using (auth.role() = 'authenticated');

create policy "Users can insert view records" on community_views
  for insert with check (auth.uid() = user_id or user_id is null);

-- Community Likes Policies
create policy "Community likes are viewable by all authenticated users" on community_likes
  for select using (auth.role() = 'authenticated');

create policy "Users can insert their own likes" on community_likes
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "Users can delete their own likes" on community_likes
  for delete using (auth.uid() = user_id);

-- HELPER FUNCTIONS

-- Get comment count for a news item
create or replace function get_comment_count(news_id_param text)
returns integer as $$
  select count(*)::integer from community_comments where news_id = news_id_param;
$$ language sql;

-- Get view count for a news item
create or replace function get_view_count(news_id_param text)
returns integer as $$
  select count(*)::integer from community_views where news_id = news_id_param;
$$ language sql;

-- Get like count for a news item
create or replace function get_like_count(news_id_param text)
returns integer as $$
  select count(*)::integer from community_likes where news_id = news_id_param;
$$ language sql;

-- Get all comments for a news item with user info
create or replace function get_comments_for_news(news_id_param text)
returns table (
  id uuid,
  author_name text,
  comment_text text,
  created_at timestamptz,
  user_id uuid
) as $$
  select id, author_name, comment_text, created_at, user_id 
  from community_comments 
  where news_id = news_id_param 
  order by created_at desc;
$$ language sql;

-- Check if user liked a post
create or replace function user_liked_post(news_id_param text, user_id_param uuid)
returns boolean as $$
  select exists(
    select 1 from community_likes 
    where news_id = news_id_param and user_id = user_id_param
  );
$$ language sql;

-- Check if user viewed a post
create or replace function user_viewed_post(news_id_param text, user_id_param uuid)
returns boolean as $$
  select exists(
    select 1 from community_views 
    where news_id = news_id_param and user_id = user_id_param
  );
$$ language sql;
