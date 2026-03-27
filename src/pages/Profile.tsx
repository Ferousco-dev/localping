import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateUser } from "../lib/auth";
import {
  getFlaggedNews,
  getLikedNews,
  getPendingNewsByUser,
  getUserPosts,
  submitCommunityNews,
} from "../lib/news";
import type { NewsItem, User } from "../lib/types";

const categories = [
  "traffic",
  "accident",
  "event",
  "government",
  "school",
  "incident",
  "community",
  "service",
];

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
  const [pendingPosts, setPendingPosts] = useState<
    Array<{ id: string; title: string; date: string }>
  >([]);
  const [userPosts, setUserPosts] = useState<NewsItem[]>([]);
  const [flaggedPosts, setFlaggedPosts] = useState<NewsItem[]>([]);
  const [likedCount, setLikedCount] = useState(0);
  const [postForm, setPostForm] = useState({
    title: "",
    description: "",
    content: "",
    image: "",
    location: user.location,
    category: categories[0],
  });
  const [posting, setPosting] = useState(false);
  const formatLabel = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);

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
  };

  const handlePost = async (event: React.FormEvent) => {
    event.preventDefault();
    if (posting) return;
    setPosting(true);
    const submitted = await submitCommunityNews({
      title: postForm.title,
      description: postForm.description,
      content: postForm.content,
      image: postForm.image,
      location: postForm.location,
      category: postForm.category,
      user,
    });
    if (submitted) {
      setUserPosts((prev) => [submitted, ...prev]);
      if (submitted.status === "pending") {
        setPendingPosts((prev) => [
          { id: submitted.id, title: submitted.title, date: submitted.date },
          ...prev,
        ]);
      }
    }
    setPostForm({
      title: "",
      description: "",
      content: "",
      image: "",
      location: user.location,
      category: categories[0],
    });
    setPosting(false);
  };

  return (
    <section className="lp-page">
      <div className="lp-profile-hero">
        <div className="lp-profile-cover">
          <img
            className="lp-profile-cover-mark"
            src="/localping.jpeg"
            alt="LocalPing logo"
          />
          <div className="lp-profile-cover-logo">
            <span>Local</span>
            <span>Ping</span>
          </div>
        </div>
        <div className="lp-profile-meta">
          <div className="lp-profile-avatar">
            <img src="/localping.jpeg" alt="LocalPing logo" />
          </div>
          <div className="lp-profile-identity">
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <div className="lp-profile-location">{user.location}</div>
          </div>
          <div className="lp-profile-tags">
            {isAdmin && <span className="lp-badge">Admin</span>}
            {user.autoPublish && (
              <span className="lp-badge subtle">Auto-post enabled</span>
            )}
          </div>
        </div>
      </div>

      <div className="lp-profile-grid">
        <div className="lp-profile-card">
          <h3>Your library</h3>
          <p>Quick access to saved and liked stories.</p>
          <div className="lp-inline-actions">
            <Link to="/likes" className="lp-button secondary">
              Likes
            </Link>
            <Link to="/bookmarks" className="lp-button secondary">
              Bookmarks
            </Link>
          </div>
        </div>

        <div className="lp-profile-card">
          <h3>Community posts</h3>
          <p>
            {user.autoPublish
              ? "Your news posts go live instantly."
              : "Posts await admin approval before going live."}
          </p>
          <div className="lp-inline-actions">
            <span className="lp-pill">{userPosts.length} posts</span>
            <span className="lp-pill">{pendingPosts.length} waiting</span>
            <span className="lp-pill muted">{flaggedPosts.length} flagged</span>
          </div>
        </div>

        <div className="lp-profile-card">
          <h3>Engagement</h3>
          <p>Your activity across the community.</p>
          <div className="lp-profile-metrics">
            <div>
              <span>Likes</span>
              <strong>{likedCount}</strong>
            </div>
            <div>
              <span>Flags</span>
              <strong>{flaggedPosts.length}</strong>
            </div>
            <div>
              <span>Reviews</span>
              <strong>0</strong>
            </div>
          </div>
        </div>
      </div>

      <form className="lp-form lp-profile-form" onSubmit={handleSave}>
        <label>
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label>
          Email
          <input value={user.email} readOnly />
        </label>
        <label>
          Location
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
        </label>
        <div className="lp-inline-actions">
          <button className="lp-button" type="submit" disabled={saving}>
            Save changes
          </button>
          <button
            className="lp-button secondary"
            type="button"
            onClick={() => onLogout()}
          >
            Log out
          </button>
        </div>
      </form>

      <div className="lp-profile-grid">
        <form className="lp-form lp-panel" onSubmit={handlePost}>
          <div>
            <h3>Post a community update</h3>
            <p>Share what is happening around you.</p>
          </div>
          <label>
            Title
            <input
              value={postForm.title}
              onChange={(event) =>
                setPostForm({ ...postForm, title: event.target.value })
              }
              required
            />
          </label>
          <label>
            Short summary
            <input
              value={postForm.description}
              onChange={(event) =>
                setPostForm({ ...postForm, description: event.target.value })
              }
            />
          </label>
          <label>
            Full story
            <textarea
              rows={4}
              value={postForm.content}
              onChange={(event) =>
                setPostForm({ ...postForm, content: event.target.value })
              }
              required
            />
          </label>
          <label>
            Image URL
            <input
              value={postForm.image}
              onChange={(event) =>
                setPostForm({ ...postForm, image: event.target.value })
              }
            />
          </label>
          <label>
            Location
            <input
              value={postForm.location}
              onChange={(event) =>
                setPostForm({ ...postForm, location: event.target.value })
              }
            />
          </label>
          <label>
            Category
            <select
              value={postForm.category}
              onChange={(event) =>
                setPostForm({ ...postForm, category: event.target.value })
              }
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {formatLabel(category)}
                </option>
              ))}
            </select>
          </label>
          <button className="lp-button" type="submit" disabled={posting}>
            {posting
              ? "Posting..."
              : user.autoPublish
              ? "Publish now"
              : "Send for approval"}
          </button>
        </form>

        <div className="lp-panel">
          <div>
            <h3>Waiting for approval</h3>
            <p>Pending posts appear here until an admin approves them.</p>
          </div>
          <div className="lp-stack">
            {pendingPosts.length === 0 && (
              <div className="lp-state">No waiting posts yet.</div>
            )}
            {pendingPosts.map((post) => (
              <div key={post.id} className="lp-inline-row">
                <div>
                  <strong>{post.title}</strong>
                  <p>Submitted {new Date(post.date).toLocaleDateString()}</p>
                </div>
                <span className="lp-pill muted">Waiting</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="lp-profile-grid">
        <div className="lp-panel">
          <div>
            <h3>Your posts</h3>
            <p>Track the updates you have submitted.</p>
          </div>
          <div className="lp-stack">
            {userPosts.length === 0 && (
              <div className="lp-state">No posts yet.</div>
            )}
            {userPosts.map((post) => (
              <div key={post.id} className="lp-inline-row">
                <div>
                  <strong>{post.title}</strong>
                  <p>
                    {post.category ? `${formatLabel(post.category)} · ` : ""}
                    {post.status === "approved" ? "Live" : "Pending"}
                  </p>
                </div>
                {post.verified && <span className="lp-pill">Verified</span>}
              </div>
            ))}
          </div>
        </div>
        <div className="lp-panel">
          <div>
            <h3>Flagged posts</h3>
            <p>Stories you flagged for review.</p>
          </div>
          <div className="lp-stack">
            {flaggedPosts.length === 0 && (
              <div className="lp-state">No flagged posts.</div>
            )}
            {flaggedPosts.map((post) => (
              <div key={post.id} className="lp-inline-row">
                <div>
                  <strong>{post.title}</strong>
                  <p>{post.authorName || post.source}</p>
                </div>
                <span className="lp-pill muted">Flagged</span>
              </div>
            ))}
          </div>
        </div>
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
