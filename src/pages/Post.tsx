import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { submitCommunityNews } from "../lib/news";
import { AlertCircle, CheckCircle } from "lucide-react";

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

export default function Post() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [posting, setPosting] = useState(false);
  const [postKind, setPostKind] = useState<"update" | "post">("update");
  const [postDestination, setPostDestination] = useState<"news" | "community">(
    user?.isVerified ? "community" : "news"
  );
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [postForm, setPostForm] = useState({
    title: "",
    content: "",
    image: "",
    location: user?.location || "",
    category: categories[0],
  });
  const formatLabel = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);

  const getFirstLine = (text: string) => {
    if (!text) return "";
    return text.split(/\r?\n/).find((line) => line.trim())?.trim() || "";
  };

  useEffect(() => {
    if (!user) return;
    if (!user.isVerified && postDestination === "community") {
      setPostDestination("news");
    }
  }, [user, postDestination]);

  const handlePost = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || posting) return;

    // Prevent posting to community if not verified
    if (postDestination === "community" && !user.isVerified) {
      setMessage({
        type: "error",
        text: "❌ Only verified users can post to the community. Please submit to News for admin review instead.",
      });
      return;
    }

    setMessage(null);
    setPosting(true);

    let submitted = false;
    let errorMsg = "";

    const destination = postDestination;

    const descriptionFromContent = getFirstLine(postForm.content);

    try {
      if (postDestination === "news") {
        // Submit to news table (requires admin approval)
        console.log("Submitting to news table...");
        const result = await submitCommunityNews({
          title: postForm.title,
          description: descriptionFromContent,
          content: postForm.content,
          image: postForm.image,
          location: postForm.location,
          category: postForm.category,
          communityKind: postKind,
          newsType: "update",
          user,
        });

        if (result) {
          submitted = true;
          setMessage({
            type: "success",
            text: "✅ Post submitted for admin review!",
          });
        } else {
          errorMsg = "Failed to submit news post. Please try again.";
        }
      } else {
        // Submit to community feed (instant publish for verified users)
        console.log("Submitting to community feed...");
        const result = await submitCommunityNews({
          title: postForm.title,
          description: descriptionFromContent,
          content: postForm.content,
          image: postForm.image,
          location: postForm.location,
          category: postForm.category,
          communityKind: "post",
          newsType: "community",
          autoPublish: true,
          user,
        });

        if (result) {
          submitted = true;
          setMessage({
            type: "success",
            text: "🎉 Your community post is live!",
          });
        } else {
          errorMsg = "Failed to post to community. Please try again.";
        }
      }

      if (!submitted && errorMsg) {
        setMessage({
          type: "error",
          text: errorMsg,
        });
      }

      if (submitted) {
        setPostForm({
          title: "",
          content: "",
          image: "",
          location: user.location,
          category: categories[0],
        });

        // Redirect after 1.5 seconds
        setTimeout(() => {
          navigate(destination === "community" ? "/community" : "/");
        }, 1500);
      }
    } catch (error) {
      console.error("Post submission error:", error);
      setMessage({
        type: "error",
        text: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <section className="lp-page">
        <div className="lp-state">Loading...</div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="lp-page">
        <div className="lp-state">
          <p>You need to be signed in to post.</p>
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

  // Show warning only if trying to post to community AND not verified
  const showVerificationWarning =
    !user.isVerified && postDestination === "community";

  return (
    <section className="lp-page lp-post">
      <div className="lp-post-hero">
        <h2>
          {postDestination === "community"
            ? "Post to Community"
            : "Submit to News"}
        </h2>
        <p>
          {postDestination === "community"
            ? "Share a quick update with your neighborhood."
            : "Send a report for admin review and approval."}
        </p>
      </div>

      {message && (
        <div className={`lp-message lp-message-${message.type}`}>
          {message.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {showVerificationWarning && (
        <div className="lp-message lp-message-error">
          <AlertCircle size={20} />
          <span>
            Only verified users can post directly to the community. Submit to
            News for admin review instead.
          </span>
        </div>
      )}

      <form className="lp-form lp-post-form" onSubmit={handlePost}>
        <fieldset className="lp-post-destination">
          <legend>Where should this post go?</legend>
          <div className="lp-destination-options">
            <label
              className={`lp-destination-option ${
                postDestination === "community" ? "active" : ""
              }`}
            >
              <input
                type="radio"
                name="destination"
                value="community"
                checked={postDestination === "community"}
                onChange={() => setPostDestination("community")}
                disabled={!user.isVerified}
              />
              <div className="lp-destination-content">
                <strong>Community</strong>
                <p>Live immediately for local readers.</p>
              </div>
            </label>
            <label
              className={`lp-destination-option ${
                postDestination === "news" ? "active" : ""
              }`}
            >
              <input
                type="radio"
                name="destination"
                value="news"
                checked={postDestination === "news"}
                onChange={() => setPostDestination("news")}
              />
              <div className="lp-destination-content">
                <strong>News</strong>
                <p>Reviewed by admins before publishing.</p>
              </div>
            </label>
          </div>
        </fieldset>
        {postDestination === "news" && (
          <label>
            Post type
            <select
              value={postKind}
              onChange={(event) =>
                setPostKind(event.target.value as "update" | "post")
              }
            >
              <option value="update">Update (brief)</option>
              <option value="post">Community post</option>
            </select>
          </label>
        )}
        <label>
          Headline
          <input
            value={postForm.title}
            onChange={(event) =>
              setPostForm({ ...postForm, title: event.target.value })
            }
            required
          />
        </label>
        <label>
          Full story
          <textarea
            rows={5}
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
        <div className="lp-post-grid">
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
        </div>
        <button
          className="lp-button"
          type="submit"
          disabled={
            posting || (postDestination === "community" && !user.isVerified)
          }
          title={
            postDestination === "community" && !user.isVerified
              ? "Only verified users can post to community"
              : ""
          }
        >
          {posting
            ? "Posting..."
            : postDestination === "community" && !user.isVerified
            ? "Verification Required"
            : postDestination === "community"
            ? "Publish to community"
            : "Submit for approval"}
        </button>
      </form>
    </section>
  );
}
