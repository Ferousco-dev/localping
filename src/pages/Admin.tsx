import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  addNews,
  addSource,
  approveNews,
  broadcast,
  deleteNews,
  deleteSource,
  getPendingNews,
  getUserCount,
  getUsers,
  rejectNews,
  updateUserAutoPublish,
  verifyUser,
  unverifyUser,
} from "../lib/admin";
import { getUpdatesNews } from "../lib/news";
import { getSources } from "../lib/sources";
import type { NewsItem, Source, User } from "../lib/types";

export default function Admin() {
  const { isAdmin, user } = useAuth();
  const updateCategories = [
    "general",
    "sports",
    "business",
    "national",
    "international",
    "weather",
    "infrastructure",
  ];
  const formatLabel = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);
  const [userCount, setUserCount] = useState(0);
  const [sources, setSources] = useState<Source[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [pendingNews, setPendingNews] = useState<NewsItem[]>([]);
  const [users, setUsers] = useState<
    Array<Pick<User, "id" | "name" | "email" | "autoPublish" | "isVerified">>
  >([]);
  const [sourceForm, setSourceForm] = useState({
    name: "",
    description: "",
    url: "",
  });
  const [newsForm, setNewsForm] = useState({
    title: "",
    description: "",
    content: "",
    image: "",
    source: "",
    location: "All",
    category: updateCategories[0],
  });
  const [broadcastText, setBroadcastText] = useState("");
  const navigate = useNavigate();
  const params = useParams();
  const activeTab = useMemo<
    "sources" | "news" | "broadcasts" | "community" | "verification"
  >(() => {
    const tab = params.tab;
    if (
      tab === "news" ||
      tab === "broadcasts" ||
      tab === "sources" ||
      tab === "community" ||
      tab === "verification"
    )
      return tab;
    return "sources";
  }, [params.tab]);

  useEffect(() => {
    if (!params.tab) navigate("/admin/sources", { replace: true });
  }, [params.tab, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    getUserCount().then((count) => setUserCount(count));
    getSources().then((items) => setSources(items));
    getUpdatesNews().then((items) => setNews(items));
    getPendingNews().then((items) => setPendingNews(items));
    getUsers().then((items) => setUsers(items));
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <section className="lp-page">
        <div className="lp-state">Admin access only.</div>
      </section>
    );
  }

  const handleAddSource = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!sourceForm.name || !sourceForm.url) return;
    const source = await addSource(sourceForm);
    if (source) setSources([source, ...sources]);
    setSourceForm({ name: "", description: "", url: "" });
  };

  const handleDeleteSource = async (id: string) => {
    await deleteSource(id);
    setSources(sources.filter((source) => source.id !== id));
  };

  const handleAddNews = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newsForm.title || !newsForm.content) return;
    const item = await addNews({
      title: newsForm.title,
      description: newsForm.description || "Local update",
      content: newsForm.content,
      image:
        newsForm.image ||
        "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=640&q=80",
      source: newsForm.source || "Local Ping Desk",
      location: newsForm.location || "All",
      category: newsForm.category || "general",
      newsType: "update",
      communityKind: "update",
    });
    if (item) setNews([item, ...news]);
    setNewsForm({
      title: "",
      description: "",
      content: "",
      image: "",
      source: "",
      location: "All",
      category: updateCategories[0],
    });
  };

  const handleDeleteNews = async (id: string) => {
    await deleteNews(id);
    setNews(news.filter((item) => item.id !== id));
  };

  const handleApproveNews = async (id: string) => {
    if (!user?.id) return;
    const approved = await approveNews(id, user.id);
    if (!approved) return;
    setPendingNews((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRejectNews = async (id: string) => {
    if (!user?.id) return;
    const rejected = await rejectNews(id, user.id);
    if (!rejected) return;
    setPendingNews((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleAutoPublish = async (
    target: Pick<User, "id" | "autoPublish">
  ) => {
    const updated = await updateUserAutoPublish(target.id, !target.autoPublish);
    if (!updated) return;
    setUsers((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  const handleVerifyUser = async (userId: string) => {
    const updated = await verifyUser(userId);
    if (!updated) return;
    setUsers((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  const handleUnverifyUser = async (userId: string) => {
    const updated = await unverifyUser(userId);
    if (!updated) return;
    setUsers((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  const handleBroadcast = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!broadcastText.trim()) return;
    await broadcast(broadcastText);
    setBroadcastText("");
  };

  const pendingCount = pendingNews.length;
  const updateCount = news.length;

  return (
    <section className="lp-page lp-admin">
      <div className="lp-admin-hero">
        <div className="lp-admin-title">
          <span className="lp-admin-kicker">Command center</span>
          <h2>Admin operations</h2>
          <p>Shape the feed, moderate community posts, and stay in control.</p>
        </div>
        <div className="lp-admin-metrics">
          <div className="lp-admin-metric">
            <span>Total users</span>
            <strong>{userCount}</strong>
          </div>
          <div className="lp-admin-metric">
            <span>Pending approvals</span>
            <strong>{pendingCount}</strong>
          </div>
          <div className="lp-admin-metric">
            <span>Update items</span>
            <strong>{updateCount}</strong>
          </div>
        </div>
      </div>

      <div className="lp-admin-shell">
        <aside className="lp-admin-nav">
          <button
            className={
              activeTab === "sources" ? "lp-admin-tab active" : "lp-admin-tab"
            }
            onClick={() => navigate("/admin/sources")}
          >
            Sources
          </button>
          <button
            className={
              activeTab === "news" ? "lp-admin-tab active" : "lp-admin-tab"
            }
            onClick={() => navigate("/admin/news")}
          >
            Updates
          </button>
          <button
            className={
              activeTab === "broadcasts"
                ? "lp-admin-tab active"
                : "lp-admin-tab"
            }
            onClick={() => navigate("/admin/broadcasts")}
          >
            Broadcasts
          </button>
          <button
            className={
              activeTab === "community" ? "lp-admin-tab active" : "lp-admin-tab"
            }
            onClick={() => navigate("/admin/community")}
          >
            News approvals
          </button>
          <button
            className={
              activeTab === "verification"
                ? "lp-admin-tab active"
                : "lp-admin-tab"
            }
            onClick={() => navigate("/admin/verification")}
          >
            Verification
          </button>
        </aside>

        <div className="lp-admin-content">
          {activeTab === "sources" && (
            <div className="lp-admin-content-grid">
              <div className="lp-admin-card">
                <h3>Add news source</h3>
                <p>Keep your trusted feeds sharp and current.</p>
                <form className="lp-form" onSubmit={handleAddSource}>
                  <label>
                    Name
                    <input
                      value={sourceForm.name}
                      onChange={(event) =>
                        setSourceForm({
                          ...sourceForm,
                          name: event.target.value,
                        })
                      }
                      required
                    />
                  </label>
                  <label>
                    Description
                    <input
                      value={sourceForm.description}
                      onChange={(event) =>
                        setSourceForm({
                          ...sourceForm,
                          description: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    URL
                    <input
                      value={sourceForm.url}
                      onChange={(event) =>
                        setSourceForm({
                          ...sourceForm,
                          url: event.target.value,
                        })
                      }
                      required
                    />
                  </label>
                  <button className="lp-button" type="submit">
                    Add source
                  </button>
                </form>
              </div>
              <div className="lp-admin-card">
                <div className="lp-admin-card-header">
                  <h3>Source list</h3>
                  <span className="lp-admin-chip">
                    {sources.length} sources
                  </span>
                </div>
                <div className="lp-admin-list">
                  {sources.length === 0 && (
                    <div className="lp-state">No sources yet.</div>
                  )}
                  {sources.map((source) => (
                    <div key={source.id} className="lp-admin-row">
                      <div>
                        <strong>{source.name}</strong>
                        <p>{source.description}</p>
                      </div>
                      <button
                        className="lp-button secondary"
                        onClick={() => handleDeleteSource(source.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "news" && (
            <div className="lp-admin-content-grid">
              <div className="lp-admin-card">
                <h3>Publish update</h3>
                <p>Craft a curated update to anchor the Updates feed.</p>
                <form className="lp-form" onSubmit={handleAddNews}>
                  <label>
                    Title
                    <input
                      value={newsForm.title}
                      onChange={(event) =>
                        setNewsForm({ ...newsForm, title: event.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    Description
                    <input
                      value={newsForm.description}
                      onChange={(event) =>
                        setNewsForm({
                          ...newsForm,
                          description: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Content
                    <textarea
                      rows={4}
                      value={newsForm.content}
                      onChange={(event) =>
                        setNewsForm({
                          ...newsForm,
                          content: event.target.value,
                        })
                      }
                      required
                    />
                  </label>
                  <label>
                    Image URL
                    <input
                      value={newsForm.image}
                      onChange={(event) =>
                        setNewsForm({ ...newsForm, image: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Source label
                    <input
                      value={newsForm.source}
                      onChange={(event) =>
                        setNewsForm({ ...newsForm, source: event.target.value })
                      }
                    />
                  </label>
                  <label>
                    Location tag
                    <input
                      value={newsForm.location}
                      onChange={(event) =>
                        setNewsForm({
                          ...newsForm,
                          location: event.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Category
                    <select
                      value={newsForm.category}
                      onChange={(event) =>
                        setNewsForm({
                          ...newsForm,
                          category: event.target.value,
                        })
                      }
                    >
                      {updateCategories.map((category) => (
                        <option key={category} value={category}>
                          {formatLabel(category)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button className="lp-button" type="submit">
                    Publish update
                  </button>
                </form>
              </div>
              <div className="lp-admin-card">
                <div className="lp-admin-card-header">
                  <h3>Published updates</h3>
                  <span className="lp-admin-chip">{news.length} live</span>
                </div>
                <div className="lp-admin-list">
                  {news.length === 0 && (
                    <div className="lp-state">No updates published.</div>
                  )}
                  {news.map((item) => (
                    <div key={item.id} className="lp-admin-row">
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.source}</p>
                      </div>
                      <button
                        className="lp-button secondary"
                        onClick={() => handleDeleteNews(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "broadcasts" && (
            <div className="lp-admin-card">
              <h3>Broadcast message</h3>
              <p>Send a high-priority alert to every user.</p>
              <form className="lp-form" onSubmit={handleBroadcast}>
                <label>
                  Message
                  <textarea
                    rows={4}
                    value={broadcastText}
                    onChange={(event) => setBroadcastText(event.target.value)}
                    required
                  />
                </label>
                <button className="lp-button" type="submit">
                  Send broadcast
                </button>
              </form>
            </div>
          )}

          {activeTab === "community" && (
            <div className="lp-admin-content-grid">
              <div className="lp-admin-card">
                <div className="lp-admin-card-header">
                  <h3>Pending news approvals</h3>
                  <span className="lp-admin-chip">
                    {pendingNews.length} waiting
                  </span>
                </div>
                <p>Approve news submissions before they appear on the homepage.</p>
                <div className="lp-admin-list">
                  {pendingNews.length === 0 && (
                    <div className="lp-state">No submissions waiting.</div>
                  )}
                  {pendingNews.map((item) => (
                    <div key={item.id} className="lp-admin-row">
                      <div>
                        <strong>{item.title}</strong>
                        <p>
                          {item.authorName
                            ? `By ${item.authorName}`
                            : item.source}
                        </p>
                      </div>
                      <button
                        className="lp-button"
                        onClick={() => handleApproveNews(item.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="lp-button secondary"
                        onClick={() => handleRejectNews(item.id)}
                      >
                        Reject
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lp-admin-card">
                <div className="lp-admin-card-header">
                  <h3>Auto-post permissions</h3>
                  <span className="lp-admin-chip">{users.length} users</span>
                </div>
                <p>Enable trusted contributors to publish instantly.</p>
                <div className="lp-admin-list">
                  {users.length === 0 && (
                    <div className="lp-state">No users found.</div>
                  )}
                  {users.map((item) => (
                    <div key={item.id} className="lp-admin-row">
                      <div>
                        <strong>{item.name}</strong>
                        <p>{item.email}</p>
                      </div>
                      <button
                        className="lp-button secondary"
                        onClick={() => handleToggleAutoPublish(item)}
                      >
                        {item.autoPublish
                          ? "Disable auto-post"
                          : "Enable auto-post"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "verification" && (
            <div className="lp-admin-card">
              <div className="lp-admin-card-header">
                <h3>User verification</h3>
                <span className="lp-admin-chip">
                  {users.filter((u) => u.isVerified).length} verified
                </span>
              </div>
              <p>
                Grant or revoke verified status. Only verified users can post to
                the community.
              </p>
              <div className="lp-admin-list">
                {users.length === 0 && (
                  <div className="lp-state">No users found.</div>
                )}
                {users.map((item) => (
                  <div key={item.id} className="lp-admin-row">
                    <div>
                      <strong>{item.name}</strong>
                      <p>{item.email}</p>
                      <p
                        style={{
                          fontSize: "0.85em",
                          color: item.isVerified ? "#4CAF50" : "#999",
                          marginTop: "4px",
                        }}
                      >
                        {item.isVerified ? "✓ Verified" : "Not verified"}
                      </p>
                    </div>
                    <button
                      className={`lp-button ${
                        item.isVerified ? "secondary" : ""
                      }`}
                      onClick={() =>
                        item.isVerified
                          ? handleUnverifyUser(item.id)
                          : handleVerifyUser(item.id)
                      }
                    >
                      {item.isVerified ? "Unverify" : "Verify"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
