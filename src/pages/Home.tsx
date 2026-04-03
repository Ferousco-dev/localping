import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getCommunityNewsByLocation,
  getViewCount,
  getLikeCount,
  checkUserLiked,
  getCommentCount,
} from "../lib/news";
import type { NewsItem } from "../lib/types";
import {
  MapPin,
  Eye,
  Heart,
  MessageCircle,
  AlertCircle,
  Inbox,
  TrendingUp,
} from "lucide-react";

const categoryColors: Record<string, string> = {
  traffic: "#F7DC6F",
  accident: "#FF6B9D",
  incident: "#C7CEEA",
  event: "#FF6B6B",
  government: "#4ECDC4",
  school: "#45B7D1",
  community: "#FFA07A",
  service: "#98D8C8",
};

type EngagementData = {
  views: number;
  likes: number;
  isLiked: boolean;
  comments: number;
};

type EngagementMap = Record<string, EngagementData>;

export default function Home() {
  const { user } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [engagement, setEngagement] = useState<EngagementMap>({});
  const [activeSection, setActiveSection] = useState<"latest" | "incidents">(
    "latest"
  );

  const location = user?.location || "Lagos, Nigeria";

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

  const loadEngagementData = useCallback(
    async (postId: string) => {
      if (!postId) return;
      try {
        const [viewsCount, likesCount, isLiked, commentsCount] =
          await Promise.all([
            getViewCount(postId),
            getLikeCount(postId),
            user?.id ? checkUserLiked(postId, user.id) : Promise.resolve(false),
            getCommentCount(postId),
          ]);

        setEngagement((prev) => ({
          ...prev,
          [postId]: {
            views: viewsCount || 0,
            likes: likesCount || 0,
            isLiked: isLiked || false,
            comments: commentsCount || 0,
          },
        }));
      } catch (e) {
        console.error("Failed to load engagement data:", e);
      }
    },
    [user?.id]
  );

  const getEngagement = (postId: string): EngagementData => {
    return (
      engagement[postId] || {
        views: 0,
        likes: 0,
        isLiked: false,
        comments: 0,
      }
    );
  };

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setLoading(true);
      setError("");
    });
    getCommunityNewsByLocation(location)
      .then((items) => {
        if (active) {
          setNews(items || []);
          items?.forEach((item) => {
            loadEngagementData(item.id);
          });
        }
      })
      .catch(() => {
        if (active) setError("Unable to load local updates.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [location, loadEngagementData]);

  const incidentCategories = ["traffic", "accident", "incident"];
  const displayedNews =
    activeSection === "incidents"
      ? news
          .filter(
            (item) =>
              item.category && incidentCategories.includes(item.category)
          )
          .slice(0, 12)
      : news.slice(0, 12);

  return (
    <section className="lp-home-feed">
      {/* Header */}
      <div className="lp-home-header">
        <h2>Local updates</h2>
        <div className="lp-location-badge">
          <MapPin size={14} />
          {location}
        </div>
      </div>

      {/* Section Tabs */}
      <div className="lp-home-tabs sticky">
        <button
          className={`lp-home-tab ${
            activeSection === "latest" ? "active" : ""
          }`}
          onClick={() => setActiveSection("latest")}
        >
          Latest reports
        </button>
        <button
          className={`lp-home-tab ${
            activeSection === "incidents" ? "active" : ""
          }`}
          onClick={() => setActiveSection("incidents")}
        >
          <TrendingUp size={16} />
          Nearby incidents
        </button>
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
        ) : displayedNews.length === 0 ? (
          <div className="lp-feed-empty">
            <div className="lp-empty-icon">
              <Inbox size={48} />
            </div>
            <p>
              {activeSection === "incidents"
                ? "No incident reports yet."
                : "No updates in your area yet."}
            </p>
          </div>
        ) : (
          displayedNews.map((item) => {
            const eng = getEngagement(item.id);
            const categoryColor =
              categoryColors[item.category || "community"] || "#999";
            return (
              <Link
                key={item.id}
                to={`/news/${encodeURIComponent(item.id)}`}
                className="lp-feed-item-link"
              >
                <div className="lp-feed-item">
                  <div className="lp-feed-item-content">
                    <div className="lp-feed-header">
                      <div className="lp-feed-meta">
                        <span className="lp-feed-source">
                          {item.source || item.authorName}
                        </span>
                        <span className="lp-feed-time">
                          {getTimeAgo(item.date)}
                        </span>
                      </div>
                      <span
                        className="lp-feed-category"
                        style={{ backgroundColor: categoryColor }}
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
                        <Eye size={16} />
                        {eng.views}
                      </span>
                      <span className="lp-feed-stat">
                        <MessageCircle size={16} />
                        {eng.comments}
                      </span>
                      <span className="lp-feed-stat">
                        <Heart size={16} />
                        {eng.likes}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}
