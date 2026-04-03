import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getCommunityNewsByLocation,
  addComment,
  getComments,
  recordView,
  getViewCount,
  toggleCommunityLike,
  getLikeCount,
  checkUserLiked,
  getCommunityPosts,
} from "../lib/news";
import type { NewsItem } from "../lib/types";
import { useSearchParams } from "react-router-dom";
import {
  MapPin,
  X,
  Eye,
  MessageCircle,
  Heart,
  AlertCircle,
  Inbox,
} from "lucide-react";

const categories = [
  "all",
  "event",
  "government",
  "school",
  "community",
  "service",
  "traffic",
  "accident",
  "incident",
];

const categoryColors: Record<string, string> = {
  all: "#999999",
  event: "#FF6B6B",
  government: "#4ECDC4",
  school: "#45B7D1",
  community: "#FFA07A",
  service: "#98D8C8",
  traffic: "#F7DC6F",
  accident: "#FF6B9D",
  incident: "#C7CEEA",
};

type EngagementData = {
  views: number;
  likes: number;
  isLiked: boolean;
  comments: Array<{
    id: string;
    author_name: string;
    comment_text: string;
    created_at: string;
  }>;
};

type EngagementMap = Record<string, EngagementData>;

export default function Community() {
  const { user } = useAuth();
  const location = user?.location || "Lagos, Nigeria";
  const [searchParams, setSearchParams] = useSearchParams();
  const initialKind =
    (searchParams.get("tab") as "all" | "updates" | "posts" | null) ?? "all";
  const [activeKind, setActiveKind] = useState<"all" | "updates" | "posts">(
    initialKind === "updates" || initialKind === "posts" ? initialKind : "all"
  );
  const [activeCategory, setActiveCategory] = useState("all");
  const [posts, setPosts] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [engagement, setEngagement] = useState<EngagementMap>({});
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const formatLabel = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);
  const getTimeAgo = (date: string) => {
    const now = new Date();
    const posted = new Date(date);
    const diff = now.getTime() - posted.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return posted.toLocaleDateString();
  };

  const loadEngagementData = useCallback(async (postId: string) => {
    if (!postId) return;
    try {
      const [viewsCount, likesCount, isLiked, comments] = await Promise.all([
        getViewCount(postId),
        getLikeCount(postId),
        user?.id ? checkUserLiked(postId, user.id) : Promise.resolve(false),
        getComments(postId),
      ]);

      setEngagement((prev) => ({
        ...prev,
        [postId]: {
          views: viewsCount || 0,
          likes: likesCount || 0,
          isLiked: isLiked || false,
          comments: comments || [],
        },
      }));
    } catch (e) {
      console.error("Failed to load engagement data:", e);
    }
  }, [user?.id]);

  const getEngagement = (postId: string): EngagementData => {
    return (
      engagement[postId] || {
        views: 0,
        likes: 0,
        isLiked: false,
        comments: [],
      }
    );
  };

  const incrementViews = async (postId: string) => {
    if (!postId) return;
    try {
      await recordView(postId, user?.id);
      const newCount = await getViewCount(postId);
      setEngagement((prev) => ({
        ...prev,
        [postId]: {
          ...getEngagement(postId),
          views: newCount || 0,
        },
      }));
    } catch (e) {
      console.error("Error recording view:", e);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!postId || !user?.id) return;
    try {
      await toggleCommunityLike(postId, user.id);
      const [likesCount, isLiked] = await Promise.all([
        getLikeCount(postId),
        checkUserLiked(postId, user.id),
      ]);

      setEngagement((prev) => ({
        ...prev,
        [postId]: {
          ...getEngagement(postId),
          likes: likesCount || 0,
          isLiked: isLiked || false,
        },
      }));
    } catch (e) {
      console.error("Error toggling like:", e);
    }
  };

  const submitComment = async (postId: string, text: string) => {
    if (!postId || !text.trim() || !user?.id) return;

    setSubmittingComment(true);
    try {
      await addComment(postId, user.name, text.trim(), user.id);
      setCommentText("");

      // Reload comments
      const comments = await getComments(postId);

      setEngagement((prev) => ({
        ...prev,
        [postId]: {
          ...getEngagement(postId),
          comments: comments || [],
        },
      }));
    } catch (e) {
      console.error("Error submitting comment:", e);
    } finally {
      setSubmittingComment(false);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setLoading(true);
      setError("");
    });
    const kindFilter =
      activeKind === "updates"
        ? "update"
        : activeKind === "posts"
        ? "post"
        : "all";
    getCommunityNewsByLocation(location, activeCategory, kindFilter)
      .then((items) => {
        if (active) {
          setPosts(items);
          // Load engagement data for all posts
          items.forEach((item) => {
            loadEngagementData(item.id);
          });
        }
      })
      .catch(() => {
        if (active) setError("Unable to load community updates.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [location, activeCategory, activeKind, loadEngagementData]);

  return (
    <section className="lp-community-feed">
      {/* Header */}
      <div className="lp-community-header">
        <h2>Community</h2>
        <div className="lp-location-badge">
          <MapPin size={14} />
          {location}
        </div>
      </div>

      {/* Type Tabs */}
      <div className="lp-feed-tabs sticky">
        {(["all", "updates", "posts"] as const).map((kind) => (
          <button
            key={kind}
            className={`lp-feed-tab ${activeKind === kind ? "active" : ""}`}
            onClick={() => {
              setActiveKind(kind);
              const next = new URLSearchParams(searchParams);
              if (kind === "all") {
                next.delete("tab");
              } else {
                next.set("tab", kind);
              }
              setSearchParams(next, { replace: true });
            }}
          >
            {kind === "all" ? "All" : kind === "updates" ? "Updates" : "Posts"}
          </button>
        ))}
      </div>

      {/* Category Tabs */}
      <div className="lp-category-scroll">
        {categories.map((category) => (
          <button
            key={category}
            className={`lp-category-pill ${
              activeCategory === category ? "active" : ""
            }`}
            onClick={() => setActiveCategory(category)}
          >
            <span
              className="lp-category-dot"
              style={{ backgroundColor: categoryColors[category] || "#ddd" }}
            ></span>
            {formatLabel(category)}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="lp-feed-list">
        {loading ? (
          <div className="lp-feed-skeletons">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="lp-feed-item-skeleton">
                <div className="lp-skeleton-avatar"></div>
                <div className="lp-skeleton-content">
                  <span className="lp-skeleton-line sm"></span>
                  <span className="lp-skeleton-line"></span>
                  <span className="lp-skeleton-line lg"></span>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="lp-feed-empty">
            <div className="lp-empty-icon">
              <AlertCircle size={48} />
            </div>
            <p>{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="lp-feed-empty">
            <div className="lp-empty-icon">
              <Inbox size={48} />
            </div>
            <p>No community posts yet for this category.</p>
          </div>
        ) : (
          posts.map((item) => {
            const eng = getEngagement(item.id);
            return (
              <div key={item.id} className="lp-feed-item">
                <div className="lp-feed-item-content">
                  <div className="lp-feed-header">
                    <div className="lp-feed-meta">
                      <span className="lp-feed-source">{item.source}</span>
                      <span className="lp-feed-time">
                        {getTimeAgo(item.date)}
                      </span>
                    </div>
                    <span
                      className="lp-feed-category"
                      style={{
                        backgroundColor:
                          categoryColors[item.category || "all"] || "#ddd",
                      }}
                    >
                      {item.category ? formatLabel(item.category) : "News"}
                    </span>
                  </div>
                  <h3 className="lp-feed-title">{item.title}</h3>
                  {item.description && (
                    <p className="lp-feed-description">{item.description}</p>
                  )}
                  {item.image && (
                    <div className="lp-feed-image">
                      <img src={item.image} alt={item.title} />
                    </div>
                  )}
                  <div className="lp-feed-footer">
                    <span
                      className="lp-feed-stat"
                      onClick={() => incrementViews(item.id)}
                    >
                      <Eye size={16} />
                      {eng.views}
                    </span>
                    <span
                      className="lp-feed-stat"
                      onClick={() => {
                        setSelectedPostId(item.id);
                        loadEngagementData(item.id);
                      }}
                    >
                      <MessageCircle size={16} />
                      {eng.comments.length}
                    </span>
                    <button
                      className={`lp-feed-stat lp-like-btn ${
                        eng.isLiked ? "liked" : ""
                      }`}
                      onClick={() => toggleLike(item.id)}
                    >
                      <Heart
                        size={16}
                        fill={eng.isLiked ? "currentColor" : "none"}
                      />
                      {eng.likes}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Comments Modal */}
      {selectedPostId && (
        <div className="lp-comments-modal-overlay">
          <div className="lp-comments-modal">
            <div className="lp-modal-header-comments">
              <h3>Comments</h3>
              <button
                className="lp-modal-close"
                onClick={() => setSelectedPostId(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="lp-comments-list">
              {getEngagement(selectedPostId).comments.length === 0 ? (
                <div className="lp-no-comments">
                  <p>No comments yet. Be the first!</p>
                </div>
              ) : (
                getEngagement(selectedPostId).comments.map((comment) => (
                  <div key={comment.id} className="lp-comment">
                    <div className="lp-comment-author">
                      {comment.author_name}
                    </div>
                    <div className="lp-comment-text">
                      {comment.comment_text}
                    </div>
                    <div className="lp-comment-time">
                      {getTimeAgo(comment.created_at)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="lp-comments-input">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="lp-comment-textarea"
                disabled={submittingComment}
              />
              <button
                className="lp-comment-submit"
                onClick={() => submitComment(selectedPostId, commentText)}
                disabled={submittingComment || !commentText.trim()}
              >
                {submittingComment ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
