import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getNewsByLocation } from "../lib/news";
import type { NewsItem } from "../lib/types";
import { MapPin, AlertCircle, Inbox, TrendingUp } from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState<"latest" | "incidents">(
    "latest"
  );

  const location = user?.location || "Lagos, Nigeria";

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
    getNewsByLocation(location)
      .then((items) => {
        if (active) {
          setNews(items || []);
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
  }, [location]);

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
