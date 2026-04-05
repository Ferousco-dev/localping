# Verified System Implementation Guide

## Overview

The verified system allows admins to mark certain users as verified. Only verified users can post to the community. This ensures quality control over community posts.

## Features

✅ **Verification Badge** - Verified users are marked with a checkmark
✅ **Post Restriction** - Only verified users can post to community
✅ **Admin Panel** - Dedicated section to manage user verification
✅ **Database Protection** - RLS policies enforce verification at the database level
✅ **Auto-verification Tracking** - Posts automatically track author verification status

---

## Installation Steps

### Step 1: Run SQL Migrations

1. Copy all SQL code from `VERIFIED_SYSTEM_SETUP.sql`
2. Go to your Supabase project dashboard
3. Open the SQL Editor
4. Paste the entire content from `VERIFIED_SYSTEM_SETUP.sql`
5. Click **Run** to execute

The SQL will:

- Add `is_verified` column to `profiles` table
- Add `author_verified` column to `community_posts` table
- Create indexes for performance
- Update RLS policies to enforce verification
- Create admin functions for verification management
- Create a trigger to auto-track author verification

### Step 2: Frontend Code is Already Updated

The following files have been automatically updated:

#### Types (`src/lib/types.ts`)

- Added `isVerified?: boolean` to the `User` type

#### Authentication (`src/lib/auth.ts`)

- Updated `fetchProfile()` to fetch `is_verified` from database
- Updated signup to set `isVerified: false` for new users

#### Admin Functions (`src/lib/admin.ts`)

- Updated `getUsers()` to include `isVerified` field
- Added `verifyUser(userId: string)` function to verify a user
- Added `unverifyUser(userId: string)` function to unverify a user

#### Admin Panel (`src/pages/Admin.tsx`)

- Added "Verification" tab in admin navigation
- Added handlers: `handleVerifyUser()` and `handleUnverifyUser()`
- Shows list of all users with verification status
- One-click button to verify/unverify users

#### Post Page (`src/pages/Post.tsx`)

- Added verification check before showing post form
- Shows error message if user is not verified
- Only allowed route is back to home if not verified

#### Community (`src/pages/Community.tsx`)

- Imported `CheckCircle` icon for verified badge display
- Ready to show verified indicator next to posts

---

## How to Use

### For Users

1. Users can sign up normally
2. By default, new users are **not verified**
3. Unverified users see a verification required message when trying to post
4. Users must wait for admin verification to post

### For Admins

1. Go to the **Admin Panel** (`/admin`)
2. Click on the **Verification** tab
3. You'll see:
   - Total number of verified users (shown as chip count)
   - List of all users with their verification status
   - Green checkmark for verified users
   - "Not verified" label for unverified users
4. Click **Verify** or **Unverify** button next to any user to toggle their status
5. Changes are instant and reflected in the database

---

## Database Schema Details

### Profiles Table Changes

```sql
ALTER TABLE profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
```

### Community Posts Table Changes

```sql
ALTER TABLE community_posts ADD COLUMN author_verified BOOLEAN DEFAULT false;
```

### RLS Policy

Only authenticated users whose `is_verified` is `true` can insert into `community_posts`:

```sql
CREATE POLICY "Only verified users can insert community posts" ON community_posts
  FOR INSERT
  WITH CHECK (
    auth.uid() = author_id
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_verified = true
    )
  );
```

---

## API Functions

### Admin Functions (src/lib/admin.ts)

#### `verifyUser(userId: string)`

- Marks a user as verified
- Returns updated user object
- Admins only

#### `unverifyUser(userId: string)`

- Removes verified status from a user
- Returns updated user object
- Admins only

#### `getUsers()`

- Returns all users with fields: id, name, email, autoPublish, **isVerified**

---

## Testing the System

### Test Case 1: Unverified User Trying to Post

1. Create a new test account
2. Try to navigate to `/post`
3. Should see: "Verification Required - Only verified users can post to the community"
4. Should have no option to post

### Test Case 2: Verify User and Check

1. Go to `/admin/verification`
2. Find the test user
3. Click **Verify**
4. User status changes to "✓ Verified" (green)
5. Refresh or re-login with test account
6. Navigate to `/post` again
7. Should now see the full post form

### Test Case 3: Admin Override

1. Go to `/admin/verification`
2. Click **Unverify** on a previously verified user
3. Status changes back to "Not verified"
4. User can no longer post

---

## Frontend Components Overview

### Admin Panel - Verification Tab

Location: `/admin/verification`

- Shows user list with verification toggle buttons
- Displays verified count in header
- One-click verification management

### Post Page

Location: `/post`

- Checks `user.isVerified` before showing form
- Shows friendly error message if not verified
- Prevents form access entirely at RLS level (backup)

### Community Feed

Location: `/`

- Can optionally display verified badge next to posts
- Shows which users are verified authors

---

## Troubleshooting

### Issue: "Only verified users can insert community posts" Error

**Cause:** User is not verified in the database
**Solution:**

1. Go to Admin > Verification tab
2. Find the user and click Verify

### Issue: User sees verification required but was just verified

**Cause:** User needs to refresh/re-login to fetch new verification status
**Solution:**

1. Have user logout
2. Have user login again
3. Verify status should now be cached

### Issue: SQL Migration Failed

**Solution:**

1. Check if `is_verified` column already exists
2. Run queries individually to identify which one failed
3. Check Supabase logs for specific error

---

## Security Considerations

✅ **Database Level:** RLS policies prevent unverified users from inserting at the database level
✅ **Frontend Level:** UI prevents unverified users from accessing the post form
✅ **Admin Only:** Only users with `admin_key = 'LOCALPING-ADMIN'` can verify/unverify
✅ **Audit Trail:** All verification changes are through Supabase (you can enable audit logs)

---

## Next Steps

1. **For Production:**

   - Run the SQL migrations in your Supabase dashboard
   - Test the system with verified and unverified users
   - Consider sending notification to users when verified

2. **Optional Enhancements:**
   - Add email notification when user is verified
   - Create a badge component to display verification status visually
   - Add verification logs/history
   - Create bulk verification/unverification feature
   - Add verification request system where users can request verification

---

## File Summary

| File                        | Changes                                      |
| --------------------------- | -------------------------------------------- |
| `src/lib/types.ts`          | Added `isVerified?: boolean` to User type    |
| `src/lib/auth.ts`           | Updated to fetch `is_verified` from profile  |
| `src/lib/admin.ts`          | Added `verifyUser`, `unverifyUser` functions |
| `src/pages/Admin.tsx`       | Added Verification tab and handlers          |
| `src/pages/Post.tsx`        | Added verification check before posting      |
| `src/pages/Community.tsx`   | Imported CheckCircle icon                    |
| `VERIFIED_SYSTEM_SETUP.sql` | SQL migrations and schema changes            |
| `verified-system.sql`       | Initial SQL code (simplified version)        |

---

## Questions?

For support or questions about the verified system implementation, refer to:

- Supabase Documentation: https://supabase.com/docs
- RLS Examples: https://supabase.com/docs/guides/auth/row-level-security
