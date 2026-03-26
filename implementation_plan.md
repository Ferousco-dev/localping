# Local Ping — News Hub Website

A location-based news aggregator built with **Vite + React + TypeScript + Vanilla CSS**. Professional, clean design using **white & red** — no gradients, no childish aesthetics, minimal border-radius, subtle shadows.

## Tech Stack

| Layer | Choice |
|---|---|
| Bundler | Vite |
| Framework | React 19 + React Router v7 |
| Language | TypeScript |
| Styling | Vanilla CSS |
| Icons | Lucide React |
| Data | localStorage + mock JSON (v1) |
| News API | [GNews API](https://gnews.io/) (free tier, location-based) |

---

## Proposed Changes

### 1. Dependencies

Install two packages:

```bash
npm install react-router-dom lucide-react
```

---

### 2. Global Styles & Design System

#### [MODIFY] [index.css](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/index.css)

Full design system reset. White background, red accent (`#D32F2F`), Inter font, sharp corners (2px max radius), minimal `box-shadow`, no gradients. CSS variables for all tokens.

---

### 3. Data Layer

#### [NEW] [storage.ts](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/lib/storage.ts)
LocalStorage abstraction for users, bookmarks, likes, notifications, sources, broadcasts.

#### [NEW] [news.ts](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/lib/news.ts)
News service: fetch by location from GNews API, fallback to mock data, like/unlike, bookmark/unbookmark, share link copy.

#### [NEW] [auth.ts](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/lib/auth.ts)
Auth helpers: signUp, login, logout, getCurrentUser, isAdmin (checks admin key).

#### [NEW] [admin.ts](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/lib/admin.ts)
Admin helpers: addSource, deleteSource, deleteNews, broadcast, getUserCount.

#### [NEW] [mock-news.json](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/data/mock-news.json)
20+ fallback articles with titles, images, bodies, sources, dates.

---

### 4. Auth Context

#### [NEW] [AuthContext.tsx](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/context/AuthContext.tsx)
React context providing user state (logged in user, isAdmin flag) across the app.

---

### 5. Auth Pages

#### [NEW] [Login.tsx](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/pages/Login.tsx)
Email + password login form. Redirects to home on success.

#### [NEW] [Signup.tsx](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/pages/Signup.tsx)
Sign up form with name, email, password, **location** (city + country). Stores in localStorage.

---

### 6. Shared Components

#### [NEW] [Header.tsx](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/components/Header.tsx)
Top bar: "Local Ping" left, admin button right (only visible to admin users).

#### [NEW] [BottomNav.tsx](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/components/BottomNav.tsx)
Bottom navigation: Home | Following | Notifications | Profile. Highlights active tab.

#### [NEW] [Layout.tsx](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/components/Layout.tsx)
Wraps pages with Header + BottomNav + content area with proper spacing.

#### [NEW] [NewsCard.tsx](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/components/NewsCard.tsx)
Headline card: title & source left, image right. Clickable → detail page.

#### [NEW] [SourceCard.tsx](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/components/SourceCard.tsx)
Source card with name, description, follow/unfollow button.

#### [NEW] [NotificationItem.tsx](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/components/NotificationItem.tsx)
Notification row: icon, message, timestamp.

#### [NEW] [ActionBar.tsx](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/components/ActionBar.tsx)
Like (heart), bookmark, share buttons for news detail page.

---

### 7. Pages

#### [NEW] [Home.tsx](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/pages/Home.tsx)
News feed showing NewsCard list. Location tag at top. Fetches news by user location.

#### [NEW] [NewsDetail.tsx](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/pages/NewsDetail.tsx)
Full article: image, title, body, source, date. ActionBar at bottom.

#### [NEW] [Profile.tsx](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/pages/Profile.tsx)
User info (name, email, location), edit profile button, logout.

#### [NEW] [Following.tsx](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/pages/Following.tsx)
List of all news sources with follow/unfollow toggles.

#### [NEW] [Notifications.tsx](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/pages/Notifications.tsx)
List of notifications: new articles from followed sources, admin broadcasts.

---

### 8. Admin Panel

#### [NEW] [Admin.tsx](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/pages/Admin.tsx)
Dashboard with: total users count, all news list with delete buttons, add/delete news sources, broadcast message form.

---

### 9. Routing & App Entry

#### [MODIFY] [App.tsx](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/App.tsx)
Replace default Vite content with React Router setup. All routes wrapped in AuthContext and Layout.

#### [DELETE] [App.css](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/App.css)
Remove default Vite styles (all styles go in [index.css](file:///Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/src/index.css) + component-level CSS files).

---

## Verification Plan

### Browser Testing
1. Run `npm run dev` and open `http://localhost:5173`
2. Verify homepage renders news cards with headline + image layout
3. Click a card → verify detail page shows full article with like/bookmark/share
4. Sign up a new user with location → verify redirect to home
5. Log in / log out → verify auth flow works
6. Toggle follow/unfollow on a source → verify state persists on refresh
7. Like and bookmark an article → verify icons toggle
8. Share → verify link is copied to clipboard
9. Login as admin → verify admin button appears in header
10. Admin panel → add source, delete news, send broadcast
11. Check notifications page shows admin broadcasts

### Manual Verification
- Resize browser to mobile width → confirm bottom nav and cards are responsive
- Confirm **no gradients**, **no rounded corners** beyond 2px, clean subtle shadows
- Confirm white & red color scheme throughout
