import mockNews from "../data/mock-news.json";
import type { NewsItem, User } from "./types";
import {
  getCache,
  invalidateCache,
  invalidateCacheByPrefix,
  setCache,
} from "./cache";
import { isSupabaseConfigured, supabase } from "./supabase";

function normalizeLocation(location: string) {
  const clean = location.trim();
  return clean.length ? clean : "Lagos, Nigeria";
}

function mapNews(row: {
  id: string;
  title: string;
  description: string;
  content: string;
  image: string | null;
  source: string;
  location: string | null;
  url: string | null;
  published_at: string | null;
  created_at: string;
  category?: string | null;
  news_type?: "community" | "update" | null;
  community_kind?: "update" | "post" | null;
  status?: "pending" | "approved" | "rejected";
  verified?: boolean | null;
  author_id?: string | null;
  author_name?: string | null;
}): NewsItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    content: row.content,
    image:
      row.image ||
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=640&q=80",
    source: row.source,
    location: row.location ?? undefined,
    url: row.url ?? undefined,
    date: row.published_at || row.created_at,
    category: row.category ?? undefined,
    newsType: row.news_type ?? undefined,
    communityKind: row.community_kind ?? undefined,
    status: row.status ?? undefined,
    verified: row.verified ?? undefined,
    authorId: row.author_id ?? undefined,
    authorName: row.author_name ?? undefined,
  };
}

function getMockNews(location: string): NewsItem[] {
  return (mockNews as NewsItem[]).map((item) => ({
    ...item,
    location,
  }));
}

async function persistNewsCache(items: NewsItem[]) {
  if (!supabase || items.length === 0) return;
  const payload = items.map((item) => ({
    id: item.id,
    title: item.title,
    description: item.description,
    content: item.content,
    image: item.image,
    source: item.source,
    url: item.url ?? null,
    location: item.location ?? null,
    published_at: item.date,
  }));
  await supabase.from("news_cache").upsert(payload, { onConflict: "id" });
}

async function getNewsCacheByIds(ids: string[]): Promise<NewsItem[]> {
  if (!supabase || ids.length === 0) return [];
  const { data, error } = await supabase
    .from("news_cache")
    .select("*")
    .in("id", ids);
  if (error || !data) return [];
  const mapped = data.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description || "Local update",
    content:
      row.content || row.description || "Full story available at source.",
    image:
      row.image ||
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=640&q=80",
    source: row.source || "Local Wire",
    url: row.url || undefined,
    location: row.location || undefined,
    date: row.published_at || row.created_at,
  })) as NewsItem[];
  const lookup = new Map(mapped.map((item) => [item.id, item]));
  return ids.map((id) => lookup.get(id)).filter(Boolean) as NewsItem[];
}

async function getNewsByIds(ids: string[]): Promise<NewsItem[]> {
  if (!supabase || ids.length === 0) return [];
  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );
  const dbIds = ids.filter(isUuid);
  const cacheIds = ids.filter((id) => !isUuid(id));
  const [dbItems, cachedItems] = await Promise.all([
    dbIds.length
      ? supabase.from("news").select("*").in("id", dbIds)
      : Promise.resolve({ data: [], error: null }),
    cacheIds.length
      ? getNewsCacheByIds(cacheIds)
      : Promise.resolve([] as NewsItem[]),
  ]);
  if (dbItems.error) return cachedItems;
  const lookup = new Map<string, NewsItem>();
  dbItems.data?.forEach((row) => lookup.set(row.id, mapNews(row)));
  cachedItems.forEach((item) => lookup.set(item.id, item));
  return ids.map((id) => lookup.get(id)).filter(Boolean) as NewsItem[];
}

function cacheLatest(items: NewsItem[]) {
  if (!items.length) return;
  setCache("news:latest", items);
}

async function getApprovedCommunityNews(
  location: string,
  category?: string,
  communityKind?: "update" | "post" | "all"
): Promise<NewsItem[]> {
  if (!supabase) return [];
  let query = supabase
    .from("news")
    .select("*")
    .eq("news_type", "community")
    .eq("status", "approved")
    .in("location", [location, "All"])
    .order("published_at", { ascending: false })
    .limit(50);
  if (communityKind && communityKind !== "all") {
    query = query.eq("community_kind", communityKind);
  }
  if (category && category !== "all") {
    query = query.eq("category", category);
  }
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(mapNews);
}

async function getApprovedNewsUpdates(location: string): Promise<NewsItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("news_type", "update")
    .eq("status", "approved")
    .in("location", [location, "All"])
    .order("published_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data.map(mapNews);
}

export async function getNewsByLocation(location: string): Promise<NewsItem[]> {
  const requestedLocation = normalizeLocation(location);
  const cacheKey = `news:updates:${requestedLocation}`;
  const cached = getCache<NewsItem[]>(cacheKey);
  if (cached) return cached;

  if (supabase) {
    const updates = await getApprovedNewsUpdates(requestedLocation);
    if (updates.length) {
      setCache(cacheKey, updates);
      cacheLatest(updates);
      return updates;
    }
  }

  if (!isSupabaseConfigured || !supabase) {
    const items = getMockNews(requestedLocation);
    const mapped = items.map((item) => ({
      ...item,
      newsType: "update" as const,
      communityKind: "update" as const,
    }));
    if (mapped.length) setCache(cacheKey, mapped);
    cacheLatest(mapped);
    return mapped;
  }

  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("news_type", "update")
    .eq("status", "approved")
    .order("published_at", { ascending: false })
    .limit(30);

  if (error || !data || data.length === 0) return [];

  const items = data.map(mapNews);
  if (items.length) setCache(cacheKey, items);
  cacheLatest(items);
  await persistNewsCache(items);
  return items;
}

export async function getCommunityNewsByLocation(
  location: string,
  category?: string,
  communityKind?: "update" | "post" | "all"
): Promise<NewsItem[]> {
  const requestedLocation = normalizeLocation(location);
  const cacheKey = `news:community:${requestedLocation}:${
    communityKind || "all"
  }:${category || "all"}`;
  const cached = getCache<NewsItem[]>(cacheKey);
  if (cached) return cached;

  if (supabase) {
    const communityItems = await getApprovedCommunityNews(
      requestedLocation,
      category,
      communityKind
    );
    if (communityItems.length) {
      setCache(cacheKey, communityItems);
      cacheLatest(communityItems);
      return communityItems;
    }
  }

  if (!isSupabaseConfigured || !supabase) {
    const items = getMockNews(requestedLocation);
    const mapped = items.map((item) => ({
      ...item,
      newsType: "community" as const,
      communityKind: "post" as const,
      category: category && category !== "all" ? category : "general",
    }));
    if (mapped.length) setCache(cacheKey, mapped);
    cacheLatest(mapped);
    return mapped;
  }

  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("news_type", "community")
    .eq("status", "approved")
    .order("published_at", { ascending: false })
    .limit(30);

  // If kind filtering is requested, apply it after fetch to avoid breaking old schemas.
  // Once community_kind is deployed everywhere, this can be moved into the query.
  const kindFilter =
    communityKind && communityKind !== "all" ? communityKind : null;

  if (error || !data || data.length === 0) {
    const items = getMockNews(requestedLocation);
    const mapped = items.map((item) => ({
      ...item,
      newsType: "community" as const,
      communityKind: "post" as const,
      category: category && category !== "all" ? category : "general",
    }));
    if (mapped.length) setCache(cacheKey, mapped);
    cacheLatest(mapped);
    await persistNewsCache(mapped);
    return mapped;
  }

  const items = data
    .map(mapNews)
    .filter((item) => (kindFilter ? item.communityKind === kindFilter : true))
    .filter((item) =>
      category && category !== "all" ? item.category === category : true
    );
  if (items.length) setCache(cacheKey, items);
  cacheLatest(items);
  await persistNewsCache(items);
  return items;
}

export async function getNewsById(id: string): Promise<NewsItem | null> {
  const latest = getCache<NewsItem[]>("news:latest");
  if (latest) {
    const found = latest.find((item) => item.id === id);
    if (found) return found;
  }
  if (supabase) {
    const { data } = await supabase
      .from("news")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (data) {
      const item = mapNews(data);
      await persistNewsCache([item]);
      return item;
    }
    const cached = await getNewsCacheByIds([id]);
    if (cached.length) return cached[0];
  }
  if (!isSupabaseConfigured || !supabase) {
    const found = (mockNews as NewsItem[]).find((item) => item.id === id);
    return found ?? null;
  }
  return null;
}

export async function getUpdatesNews(): Promise<NewsItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("news_type", "update")
    .eq("status", "approved")
    .order("published_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return data.map(mapNews);
}

export async function submitCommunityNews(input: {
  title: string;
  description?: string;
  content: string;
  image?: string;
  location?: string;
  category?: string;
  source?: string;
  communityKind?: "update" | "post";
  newsType?: "community" | "update";
  autoPublish?: boolean;
  user: User;
}) {
  if (!supabase) return null;
  const autoPublish =
    typeof input.autoPublish === "boolean"
      ? input.autoPublish
      : input.user.autoPublish ?? false;
  const now = new Date().toISOString();
  const communityKind = input.communityKind ?? "post";
  const newsType = input.newsType ?? "community";
  const description =
    input.description?.trim() ||
    (communityKind === "update" ? "Community update" : "Community post");
  const content = input.content?.trim() || description || input.title.trim();
  const payload = {
    title: input.title.trim(),
    description,
    content,
    image:
      input.image?.trim() ||
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=640&q=80",
    source: input.source?.trim() || `${input.user.name} (Community)`,
    location: input.location?.trim() || "All",
    category: input.category?.trim().toLowerCase() || "general",
    news_type: newsType,
    community_kind: communityKind,
    status: autoPublish ? "approved" : "pending",
    verified: autoPublish,
    author_id: input.user.id,
    author_name: input.user.name,
    approved_at: autoPublish ? now : null,
    published_at: autoPublish ? now : null,
  };
  const { data, error } = await supabase
    .from("news")
    .insert(payload)
    .select("*")
    .single();
  if (error || !data) return null;
  invalidateCacheByPrefix("news:community:");
  invalidateCacheByPrefix("news:updates:");
  if (autoPublish) {
    await supabase.from("news_cache").upsert(
      {
        id: data.id,
        title: data.title,
        description: data.description,
        content: data.content,
        image: data.image,
        source: data.source,
        url: data.url ?? null,
        location: data.location ?? null,
        published_at: data.published_at ?? data.created_at,
      },
      { onConflict: "id" }
    );
  }
  return mapNews(data);
}

export async function getPendingNewsByUser(userId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("status", "pending")
    .eq("news_type", "update")
    .eq("author_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapNews);
}

export async function getUserPosts(userId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("author_id", userId)
    .eq("news_type", "community")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapNews);
}

export async function toggleFlag(userId: string, newsId: string) {
  if (!supabase) return false;
  const { data } = await supabase
    .from("flags")
    .select("id")
    .eq("user_id", userId)
    .eq("news_id", newsId)
    .maybeSingle();
  if (data?.id) {
    await supabase.from("flags").delete().eq("id", data.id);
    return false;
  }
  await supabase.from("flags").insert({ user_id: userId, news_id: newsId });
  return true;
}

export async function getFlagStatus(userId: string, newsId: string) {
  if (!supabase) return false;
  const { data } = await supabase
    .from("flags")
    .select("id")
    .eq("user_id", userId)
    .eq("news_id", newsId)
    .maybeSingle();
  return !!data?.id;
}

export async function getFlaggedNews(userId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("flags")
    .select("news_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const ids = data.map((row) => row.news_id);
  return getNewsByIds(ids);
}

export async function toggleLike(userId: string, newsId: string) {
  if (!supabase) return false;
  const { data } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", userId)
    .eq("news_id", newsId)
    .maybeSingle();

  if (data?.id) {
    await supabase.from("likes").delete().eq("id", data.id);
    invalidateCache(`likes:${userId}`);
    return false;
  }

  await supabase.from("likes").insert({ user_id: userId, news_id: newsId });
  invalidateCache(`likes:${userId}`);
  return true;
}

export async function toggleBookmark(userId: string, newsId: string) {
  if (!supabase) return false;
  const { data } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("news_id", newsId)
    .maybeSingle();

  if (data?.id) {
    await supabase.from("bookmarks").delete().eq("id", data.id);
    invalidateCache(`bookmarks:${userId}`);
    return false;
  }

  await supabase.from("bookmarks").insert({ user_id: userId, news_id: newsId });
  invalidateCache(`bookmarks:${userId}`);
  return true;
}

export async function getLikeStatus(userId: string, newsId: string) {
  if (!supabase) return false;
  const { data } = await supabase
    .from("likes")
    .select("id")
    .eq("user_id", userId)
    .eq("news_id", newsId)
    .maybeSingle();
  return !!data?.id;
}

export async function getBookmarkStatus(userId: string, newsId: string) {
  if (!supabase) return false;
  const { data } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("news_id", newsId)
    .maybeSingle();
  return !!data?.id;
}

export async function getLikedNews(userId: string): Promise<NewsItem[]> {
  if (!supabase) return [];
  const cacheKey = `likes:${userId}`;
  const cached = getCache<NewsItem[]>(cacheKey);
  if (cached) return cached;
  const { data, error } = await supabase
    .from("likes")
    .select("news_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const ids = data.map((row) => row.news_id);
  const items = await getNewsByIds(ids);
  setCache(cacheKey, items);
  cacheLatest(items);
  return items;
}

export async function getBookmarkedNews(userId: string): Promise<NewsItem[]> {
  if (!supabase) return [];
  const cacheKey = `bookmarks:${userId}`;
  const cached = getCache<NewsItem[]>(cacheKey);
  if (cached) return cached;
  const { data, error } = await supabase
    .from("bookmarks")
    .select("news_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  const ids = data.map((row) => row.news_id);
  const items = await getNewsByIds(ids);
  setCache(cacheKey, items);
  cacheLatest(items);
  return items;
}

export async function shareNews(url: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(url);
    return true;
  }
  window.prompt("Copy this link", url);
  return false;
}

export async function searchNews(query: string): Promise<NewsItem[]> {
  const term = query.trim();
  if (!term) return [];
  const cacheKey = `search:${term.toLowerCase()}`;
  const cached = getCache<NewsItem[]>(cacheKey);
  if (cached) return cached;
  if (!isSupabaseConfigured || !supabase) {
    const items = (mockNews as NewsItem[]).filter(
      (item) =>
        item.title.toLowerCase().includes(term.toLowerCase()) ||
        item.description.toLowerCase().includes(term.toLowerCase())
    );
    setCache(cacheKey, items);
    cacheLatest(items);
    return items;
  }
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .eq("status", "approved")
    .or(`title.ilike.%${term}%,description.ilike.%${term}%`)
    .order("published_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  const items = data.map(mapNews);
  setCache(cacheKey, items);
  cacheLatest(items);
  return items;
}

// ===== COMMUNITY ENGAGEMENT FUNCTIONS =====

export async function addComment(
  newsId: string,
  authorName: string,
  commentText: string,
  userId?: string
) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("community_comments")
      .insert({
        news_id: newsId,
        user_id: userId || null,
        author_name: authorName,
        comment_text: commentText,
      })
      .select()
      .single();
    if (error) {
      console.error("Failed to add comment:", error);
      return null;
    }
    return data;
  } catch (e) {
    console.error("Error adding comment:", e);
    return null;
  }
}

export async function getComments(newsId: string) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("community_comments")
      .select("*")
      .eq("news_id", newsId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to fetch comments:", error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("Error fetching comments:", e);
    return [];
  }
}

export async function deleteComment(commentId: string, userId: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from("community_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", userId);
    if (error) {
      console.error("Failed to delete comment:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Error deleting comment:", e);
    return false;
  }
}

export async function recordView(newsId: string, userId?: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from("community_views")
      .insert({
        news_id: newsId,
        user_id: userId || null,
      })
      .select()
      .single();
    if (error && error.code !== "PGRST116") {
      // PGRST116 is unique constraint violation, which means this user already viewed
      console.error("Failed to record view:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Error recording view:", e);
    return false;
  }
}

export async function getViewCount(newsId: string) {
  if (!supabase) return 0;
  try {
    const { count, error } = await supabase
      .from("community_views")
      .select("*", { count: "exact", head: true })
      .eq("news_id", newsId);
    if (error) {
      console.error("Failed to get view count:", error);
      return 0;
    }
    return count || 0;
  } catch (e) {
    console.error("Error getting view count:", e);
    return 0;
  }
}

export async function toggleCommunityLike(newsId: string, userId: string) {
  if (!supabase) return null;
  try {
    // Check if already liked
    const { data: existing, error: checkError } = await supabase
      .from("community_likes")
      .select("id")
      .eq("news_id", newsId)
      .eq("user_id", userId)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking like status:", checkError);
      return null;
    }

    if (existing) {
      // Delete like
      const { error: deleteError } = await supabase
        .from("community_likes")
        .delete()
        .eq("id", existing.id);
      if (deleteError) {
        console.error("Failed to unlike:", deleteError);
        return null;
      }
      return false;
    } else {
      // Add like
      const { error: insertError } = await supabase
        .from("community_likes")
        .insert({
          news_id: newsId,
          user_id: userId,
        });
      if (insertError) {
        console.error("Failed to like:", insertError);
        return null;
      }
      return true;
    }
  } catch (e) {
    console.error("Error toggling like:", e);
    return null;
  }
}

export async function getLikeCount(newsId: string) {
  if (!supabase) return 0;
  try {
    const { count, error } = await supabase
      .from("community_likes")
      .select("*", { count: "exact", head: true })
      .eq("news_id", newsId);
    if (error) {
      console.error("Failed to get like count:", error);
      return 0;
    }
    return count || 0;
  } catch (e) {
    console.error("Error getting like count:", e);
    return 0;
  }
}

export async function checkUserLiked(
  newsId: string,
  userId: string
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase
      .from("community_likes")
      .select("id")
      .eq("news_id", newsId)
      .eq("user_id", userId)
      .single();
    if (error && error.code !== "PGRST116") {
      console.error("Error checking user like:", error);
      return false;
    }
    return !!data;
  } catch (e) {
    console.error("Error in checkUserLiked:", e);
    return false;
  }
}

export async function getCommentCount(newsId: string) {
  if (!supabase) return 0;
  try {
    const { count, error } = await supabase
      .from("community_comments")
      .select("*", { count: "exact", head: true })
      .eq("news_id", newsId);
    if (error) {
      console.error("Failed to get comment count:", error);
      return 0;
    }
    return count || 0;
  } catch (e) {
    console.error("Error getting comment count:", e);
    return 0;
  }
}

// ===== DIRECT COMMUNITY POSTS (No Admin Approval) =====

export async function submitDirectCommunityPost(input: {
  title: string;
  description: string;
  content: string;
  image: string;
  location: string;
  category: string;
  user: User;
}) {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("community_posts").insert({
      title: input.title,
      description: input.description,
      content: input.content,
      image: input.image || null,
      location: input.location,
      category: input.category,
      author_id: input.user.id,
      author_name: input.user.name,
    });
    if (error) {
      console.error("Failed to submit community post:", error);
      return false;
    }
    invalidateCache("community_posts");
    return true;
  } catch (e) {
    console.error("Error submitting community post:", e);
    return false;
  }
}

export async function getCommunityPosts(
  location?: string,
  category?: string
): Promise<NewsItem[]> {
  if (!supabase) return [];
  try {
    let query = supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (location && location !== "All") {
      query = query.eq("location", location);
    }

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Failed to fetch community posts:", error);
      return [];
    }

    return (
      data?.map((post) => ({
        id: post.id,
        title: post.title,
        description: post.description || "",
        content: post.content,
        image: post.image || "",
        source: post.author_name,
        date: post.created_at,
        url: "",
        location: post.location,
        category: post.category,
        author_id: post.author_id,
        author_name: post.author_name,
        verified: false,
      })) || []
    );
  } catch (e) {
    console.error("Error fetching community posts:", e);
    return [];
  }
}

export async function getUserCommunityPosts(
  userId: string
): Promise<NewsItem[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("community_posts")
      .select("*")
      .eq("author_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Failed to fetch user community posts:", error);
      return [];
    }

    return (
      data?.map((post) => ({
        id: post.id,
        title: post.title,
        description: post.description || "",
        content: post.content,
        image: post.image || "",
        source: post.author_name,
        date: post.created_at,
        url: "",
        location: post.location,
        category: post.category,
        author_id: post.author_id,
        author_name: post.author_name,
        verified: false,
      })) || []
    );
  } catch (e) {
    console.error("Error fetching user community posts:", e);
    return [];
  }
}

export async function deleteCommunityPost(
  postId: string,
  userId: string
): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from("community_posts")
      .delete()
      .eq("id", postId)
      .eq("author_id", userId);
    if (error) {
      console.error("Failed to delete community post:", error);
      return false;
    }
    invalidateCache("community_posts");
    return true;
  } catch (e) {
    console.error("Error deleting community post:", e);
    return false;
  }
}

export async function deleteNewsPost(
  postId: string,
  userId: string
): Promise<boolean> {
  if (!supabase) return false;
  try {
    // Verify the user owns the post
    const { data: post, error: fetchError } = await supabase
      .from("news")
      .select("author_id")
      .eq("id", postId)
      .single();

    if (fetchError || !post || post.author_id !== userId) {
      console.error("Unauthorized to delete post:", fetchError);
      return false;
    }

    const { error } = await supabase
      .from("news")
      .delete()
      .eq("id", postId)
      .eq("author_id", userId);

    if (error) {
      console.error("Failed to delete news post:", error);
      return false;
    }

    invalidateCache("news");
    invalidateCache("news_cache");
    return true;
  } catch (e) {
    console.error("Error deleting news post:", e);
    return false;
  }
}
