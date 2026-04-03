import { useEffect, useState } from "react";
import {
  LogOut,
  Plus,
  Inbox,
  AlertCircle,
  Settings,
  Check,
  Flag,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateUser } from "../lib/auth";
import {
  getFlaggedNews,
  getLikedNews,
  getPendingNewsByUser,
  getUserPosts,
} from "../lib/news";
import type { NewsItem, User } from "../lib/types";

function ProfileContent({
  user,
  isAdmin,
  onLogout,
  onRefresh,
}: {
  user: User;
  isAdmin: boolean;
  onLogout: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [name, setName] = useState(user.name);
  const [location, setLocation] = useState(user.location);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "pending" | "flagged">(
    "posts"
  );
  const [pendingPosts, setPendingPosts] = useState<
    Array<{ id: string; title: string; date: string }>
  >([]);
  const [userPosts, setUserPosts] = useState<NewsItem[]>([]);
  const [flaggedPosts, setFlaggedPosts] = useState<NewsItem[]>([]);
  const [likedCount, setLikedCount] = useState(0);

  useEffect(() => {
    getPendingNewsByUser(user.id).then((items) => {
      setPendingPosts(
        items.map((item) => ({
          id: item.id,
          title: item.title,
          date: item.date,
        }))
      );
    });
    getUserPosts(user.id).then((items) => {
      setUserPosts(items);
    });
    getFlaggedNews(user.id).then((items) => {
      setFlaggedPosts(items);
    });
    getLikedNews(user.id).then((items) => {
      setLikedCount(items.length);
    });
  }, [user.id]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    await updateUser({ ...user, name: name.trim(), location: location.trim() });
    await onRefresh();
    setSaving(false);
    setShowSettings(false);
  };

  return (
    <section className="lp-profile-modern">
      {/* Header - Compact and clean */}
      <div className="lp-profile-header">
        <div className="lp-profile-header-content">
          <div className="lp-profile-avatar-compact">
            <img src="/localping.jpeg" alt={user.name} />
          </div>
          <div className="lp-profile-header-info">
            <div>
              <h1>{user.name}</h1>
              <span className="lp-profile-location-badge">
                <Inbox size={14} style={{ display: "inline" }} />{" "}
                {user.location}
              </span>
            </div>
            {isAdmin && <span className="lp-admin-badge">ADMIN</span>}
          </div>
        </div>
        <button
          className="lp-profile-settings-toggle"
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="lp-profile-quick-stats">
        <div className="lp-quick-stat">
          <strong>{userPosts.length}</strong>
          <span>Posts</span>
        </div>
        <div className="lp-quick-stat">
          <strong>{pendingPosts.length}</strong>
          <span>Pending</span>
        </div>
        <div className="lp-quick-stat">
          <strong>{likedCount}</strong>
          <span>Likes</span>
        </div>
        <div className="lp-quick-stat">
          <strong>{flaggedPosts.length}</strong>
          <span>Flags</span>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="lp-profile-cta">
        <Link to="/post" className="lp-cta-primary">
          <Plus size={18} /> New Post
        </Link>
        <Link to="/activities" className="lp-cta-secondary">
          Activities
        </Link>
        {isAdmin && (
          <Link to="/admin" className="lp-cta-admin">
            Admin Panel
          </Link>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="lp-settings-modal">
          <div
            className="lp-modal-overlay"
            onClick={() => setShowSettings(false)}
          />
          <div className="lp-modal-content">
            <div className="lp-modal-header">
              <h2>Account Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="lp-modal-close"
              >
                <AlertCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="lp-modal-form">
              <div className="lp-form-field">
                <label>Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  type="text"
                />
              </div>
              <div className="lp-form-field">
                <label>Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  type="text"
                />
              </div>
              <div className="lp-form-field">
                <label>Email</label>
                <input value={user.email} disabled type="email" />
              </div>
              <button type="submit" className="lp-modal-save" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                className="lp-modal-logout"
                onClick={onLogout}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="lp-profile-tabs">
        <button
          className={`lp-tab ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          Posts
          <span>{userPosts.length}</span>
        </button>
        <button
          className={`lp-tab ${activeTab === "pending" ? "active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          <Inbox size={16} />
          Pending
          <span>{pendingPosts.length}</span>
        </button>
        <button
          className={`lp-tab ${activeTab === "flagged" ? "active" : ""}`}
          onClick={() => setActiveTab("flagged")}
        >
          <AlertCircle size={16} />
          Flagged
          <span>{flaggedPosts.length}</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="lp-profile-tab-content">
        {activeTab === "posts" && (
          <div className="lp-tab-pane">
            {userPosts.length === 0 ? (
              <div className="lp-empty-message">
                <p>No posts yet. Start creating!</p>
              </div>
            ) : (
              <div className="lp-posts-list">
                {userPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/news/${encodeURIComponent(post.id)}`}
                    className="lp-post-item"
                  >
                    <div className="lp-post-header">
                      <h3>{post.title}</h3>
                      {post.verified && (
                        <span className="lp-verified">
                          <Check size={16} />
                        </span>
                      )}
                    </div>
                    <p className="lp-post-meta">
                      {post.category} •{" "}
                      {post.status === "approved" ? "Live" : "Pending"}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "pending" && (
          <div className="lp-tab-pane">
            {pendingPosts.length === 0 ? (
              <div className="lp-empty-message">
                <p>No pending posts</p>
              </div>
            ) : (
              <div className="lp-posts-list">
                {pendingPosts.map((post) => (
                  <div key={post.id} className="lp-post-item">
                    <div className="lp-post-header">
                      <h3>{post.title}</h3>
                      <span className="lp-status-waiting">
                        <Clock size={16} />
                      </span>
                    </div>
                    <p className="lp-post-meta">
                      Submitted {new Date(post.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "flagged" && (
          <div className="lp-tab-pane">
            {flaggedPosts.length === 0 ? (
              <div className="lp-empty-message">
                <p>No flagged posts</p>
              </div>
            ) : (
              <div className="lp-posts-list">
                {flaggedPosts.map((post) => (
                  <div key={post.id} className="lp-post-item">
                    <div className="lp-post-header">
                      <h3>{post.title}</h3>
                      <span className="lp-status-flagged">
                        <Flag size={16} />
                      </span>
                    </div>
                    <p className="lp-post-meta">
                      by {post.authorName || post.source}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default function Profile() {
  const { user, logout, refresh, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <section className="lp-page">
        <div className="lp-profile-skeleton">
          <div className="lp-skeleton-card"></div>
          <div className="lp-skeleton-card"></div>
          <div className="lp-skeleton-card tall"></div>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="lp-page">
        <div className="lp-state">
          <p>You are not signed in.</p>
          <div className="lp-inline-actions">
            <Link to="/login" className="lp-button">
              Log in
            </Link>
            <Link to="/signup" className="lp-button secondary">
              Create account
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <ProfileContent
      key={user.id}
      user={user}
      isAdmin={isAdmin}
      onLogout={() => void logout()}
      onRefresh={refresh}
    />
  );
}
