import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, X } from "lucide-react";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const formRef = useRef<HTMLFormElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!location.pathname.startsWith("/search")) return;
    const params = new URLSearchParams(location.search);
    const nextQuery = params.get("q") || "";
    Promise.resolve().then(() => {
      setQuery(nextQuery);
    });
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!formRef.current) return;
      if (!formRef.current.contains(target) && !query.trim()) {
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [query]);

  useEffect(() => {
    if (expanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [expanded]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!query.trim()) return;
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    setExpanded(false);
  };

  const handleClose = () => {
    setExpanded(false);
    setQuery("");
  };

  return (
    <header className="lp-header-modern">
      <Link to="/" className="lp-brand-modern">
        <div className="lp-brand-icon">
          <span>📍</span>
        </div>
        <div className="lp-brand-text">
          <span className="lp-brand-primary">Local</span>
          <span className="lp-brand-accent">Ping</span>
        </div>
      </Link>
      <form
        ref={formRef}
        className={`lp-search-modern ${expanded ? "expanded" : ""}`}
        onSubmit={handleSubmit}
      >
        <Search className="lp-search-icon-modern" size={18} />
        <input
          ref={inputRef}
          type="search"
          placeholder="Search updates..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="lp-search-input-modern"
          aria-label="Search"
        />
        {expanded && (
          <button
            type="button"
            className="lp-search-clear"
            onClick={handleClose}
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        )}
      </form>
    </header>
  );
}
