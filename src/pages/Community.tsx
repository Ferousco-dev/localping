import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCommunityNewsByLocation } from "../lib/news";
import type { NewsItem } from "../lib/types";
import { useSearchParams } from "react-router-dom";
import { MapPin, MessageCircle, Heart, X } from "lucide-react";

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

type Engagement = {
  views: number;
  likes: Set<string>;
  comments: { id: string; author: string; text: string; timestamp: string }[];
};

type EngagementMap = Record<string, Engagement>;

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

  // Load engagement from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("community_engagement");
      if (stored) {
        const data = JSON.parse(stored);
        // Convert likes arrays back to Sets
        const converted: EngagementMap = {};
        for (const [postId, eng] of Object.entries(data)) {
          converted[postId] = {
            ...(eng as Engagement),
            likes: new Set((eng as any).likes || []),
          };
        }
        setEngagement(converted);
      }
    } catch (e) {
      console.error("Failed to load engagement data:", e);
    }
  }, []);

  // Save engagement to localStorage
  const saveEngagement = (newEngagement: EngagementMap) => {
    try {
      const toStore: Record<string, any> = {};
      for (const [postId, eng] of Object.entries(newEngagement)) {
        toStore[postId] = {
          ...eng,
          likes: Array.from(eng.likes),
        };
      }
      localStorage.setItem("community_engagement", JSON.stringify(toStore));
    } catch (e) {
      console.error("Failed to save engagement data:", e);
    }
  };

  const getEngagement = (postId: string): Engagement => {
    return (
      engagement[postId] || {
        views: 0,
        likes: new Set(),
        comments: [],
      }
    );
  };

  const incrementViews = (postId: string) => {
    setEngagement((prev) => {
      const newEng = { ...prev };
      if (!newEng[postId]) {
        newEng[postId] = {
          views: 1,
          likes: new Set(),
          comments: [],
        };
      } else {
        newEng[postId] = {
          ...newEng[postId],
          views: newEng[postId].views + 1,
        };
      }
      saveEngagement(newEng);
      return newEng;
    });
  };

  const toggleLike = (postId: string) => {
    setEngagement((prev) => {
      const newEng = { ...prev };
      if (!newEng[postId]) {
        newEng[postId] = {
          views: 0,
          likes: new Set([user?.id || "anonymous"]),
          comments: [],
        };
      } else {
        const newLikes = new Set(newEng[postId].likes);
        const userId = user?.id || "anonymous";
        if (newLikes.has(userId)) {
          newLikes.delete(userId);
        } else {
          newLikes.add(userId);
        }
        newEng[postId] = {
          ...newEng[postId],
          likes: newLikes,
        };
      }
      saveEngagement(newEng);
      return newEng;
    });
  };

  const addComment = (postId: string, text: string) => {
    if (!text.trim()) return;
    setEngagement((prev) => {
      const newEng = { ...prev };
      if (!newEng[postId]) {
        newEng[postId] = {
          views: 0,
          likes: new Set(),
          comments: [],
        };
      }
      newEng[postId].comments.push({
        id: Date.now().toString(),
        author: user?.name || "Anonymous",
        text: text.trim(),
        timestamp: new Date().toISOString(),
      });
      saveEngagement(newEng);
      return newEng;
    });
    setCommentText("");
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const kindFilter =
      activeKind === "updates"
        ? "update"
        : activeKind === "posts"
        ? "post"
        : "all";
    getCommunityNewsByLocation(location, activeCategory, kindFilter)
      .then((items) => {
        if (active) setPosts(items);
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
  }, [location, activeCategory, activeKind]);

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
            <div className="lp-empty-icon">⚠️</div>
            <p>{error}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="lp-feed-empty">
            <div className="lp-empty-icon">📭</div>
            <p>No community posts yet for this category.</p>
          </div>
        ) : (
          posts.map((item) => (
            <Link
              key={item.id}
              to={`/news/${item.id}`}
              className="lp-feed-item"
            >
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
                  <span className="lp-feed-stat">
                    👁 {Math.floor(Math.random() * 5000)}
                  </span>
                  <span className="lp-feed-stat">
                    💬 {Math.floor(Math.random() * 100)}
                  </span>
                  <span className="lp-feed-stat">
                    ❤️ {Math.floor(Math.random() * 500)}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
