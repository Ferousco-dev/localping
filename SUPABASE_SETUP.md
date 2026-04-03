# Supabase Setup Guide

The "Failed to fetch" error means your environment variables for Supabase are not configured.

## Quick Fix:

### 1. Get your Supabase credentials

- Go to [Supabase Dashboard](https://app.supabase.com)
- Select your project
- Go to **Settings → API** (left sidebar)
- Copy the following values:
  - **Project URL** (e.g., `https://your-project-id.supabase.co`)
  - **Anon Public Key** (the one labeled "anon | public")

### 2. Update `.env.local`

Edit `/Users/oresajooluwaferanmiidunuoluwa/Desktop/WORKS/moses/.env.local`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Restart the Dev Server

```bash
# Kill the current server (Ctrl+C)
# Then restart:
npm run dev
```

## Verify It Works:

- Open browser console (F12)
- The "Failed to fetch" error should be gone
- You should be able to sign in/sign up

## Troubleshooting:

**Still getting "Failed to fetch"?**

1. Check your Supabase project is **not paused** (check billing)
2. Verify the URL doesn't have typos (should end with `.supabase.co`)
3. Check your Anon Key starts with `eyJhb...` (JWT format)
4. Try incognito/private window to clear cache
5. Check if Supabase service is operational on [status.supabase.com](https://status.supabase.com)

**Can't find your project credentials?**

1. If you haven't created a project yet:

   - Go to [Supabase](https://app.supabase.com)
   - Click "New Project"
   - Enter database password
   - Wait ~2 minutes for it to initialize
   - Then follow steps above

2. If project is paused:
   - Go to **Settings → Billing → Pause/Resume**
   - Resume the project
   - Wait 1-2 minutes for it to come back online
