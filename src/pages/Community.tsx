import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getCommunityNewsByLocation } from "../lib/news";
import type { NewsItem } from "../lib/types";
import { Link, useSearchParams } from "react-router-dom";
import { MapPin, AlertCircle, Inbox } from "lucide-react";

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

  const formatLabel = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);
  const trimWords = (text: string, limit: number) => {
    const words = text.trim().split(/\s+/);
    if (words.length <= limit) return text.trim();
    return `${words.slice(0, limit).join(" ")}…`;
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
      .then((newsItems) => {
        if (active) {
          setPosts(newsItems || []);
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
            return (
              <Link
                key={item.id}
                to={`/news/${encodeURIComponent(item.id)}`}
                className="lp-feed-item-link"
              >
                <div className="lp-home-card">
                  <div className="lp-home-card-text">
                    <h3 className="lp-home-card-title">{item.title}</h3>
                    {item.description && (
                      <p className="lp-home-card-description">
                        {trimWords(item.description, 16)}
                      </p>
                    )}
                  </div>
                  {item.image && (
                    <div className="lp-home-card-image">
                      <img src={item.image} alt={item.title} />
                    </div>
                  )}
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
