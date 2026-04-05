#!/bin/bash

# Verified System Implementation Checklist

## ✅ COMPLETED ITEMS

### Code Changes (Already Done)

- [x] Updated src/lib/types.ts - Added isVerified to User type
- [x] Updated src/lib/auth.ts - Fetch is_verified from database
- [x] Updated src/lib/admin.ts - Added verifyUser() and unverifyUser() functions
- [x] Updated src/pages/Admin.tsx - Added Verification tab with management UI
- [x] Updated src/pages/Post.tsx - Added verification check for posting
- [x] Updated src/pages/Community.tsx - Imported verification icons

### SQL Files Created

- [x] verified-system.sql - Basic verified system SQL
- [x] VERIFIED_SYSTEM_SETUP.sql - Complete SQL with triggers and functions
- [x] VERIFIED_SYSTEM_README.md - Comprehensive documentation

## 📋 NEXT STEPS FOR YOU

### Step 1: Deploy SQL Changes

- [ ] Open Supabase Dashboard → SQL Editor
- [ ] Copy content from VERIFIED_SYSTEM_SETUP.sql
- [ ] Paste into SQL Editor
- [ ] Click Run to execute all migrations

### Step 2: Test the System

- [ ] Create a test account (e.g., test@example.com)
- [ ] Try to access /post page (should show "Verification Required")
- [ ] Go to admin /admin/verification page
- [ ] Click "Verify" on the test user
- [ ] Log back in with test account
- [ ] Try /post page again (should now show post form)
- [ ] Create a test post
- [ ] Verify post appears in community feed

### Step 3: Live Deployment

- [ ] Notify existing users about verification system
- [ ] Optionally: Pre-verify trusted community members
- [ ] Monitor admin panel for verification requests
- [ ] Create process for user verification (email requests, etc.)

### Step 4: Optional Enhancements

- [ ] Add email notifications for verification
- [ ] Create verification request form
- [ ] Add verification badges throughout UI
- [ ] Create admin dashboard stats
- [ ] Set up audit logging

---

## 🚀 QUICK START COMMANDS

### 1. Copy SQL to Clipboard (macOS)

```bash
cat VERIFIED_SYSTEM_SETUP.sql | pbcopy
```

### 2. Copy SQL to Clipboard (Linux)

```bash
cat VERIFIED_SYSTEM_SETUP.sql | xclip -selection clipboard
```

### 3. Copy SQL to Clipboard (Windows/Git Bash)

```bash
cat VERIFIED_SYSTEM_SETUP.sql | clip
```

---

## 📊 ADMIN PANEL WORKFLOW

1. **Go to Admin**

   - URL: http://localhost:5173/admin/verification
   - (or your production URL)

2. **View Users**

   - All users listed with:
     - Name
     - Email
     - Verification status (green checkmark if verified)
     - Verify/Unverify button

3. **Verify a User**

   - Click "Verify" button
   - Status updates immediately to "✓ Verified"
   - User can now post to community

4. **Unverify a User**
   - Click "Unverify" button
   - Status updates immediately to "Not verified"
   - User loses posting ability

---

## 🔍 WHAT USERS WILL SEE

### Unverified User Trying to Post

```
[Verification Required Icon]
Verification Required
Only verified users can post to the community.

Contact an admin to get your account verified
and start posting.

[Back home button]
```

### Verified User on Post Page

```
[Full post form with all fields]
- Title input
- Description input
- Content textarea
- Image URL input
- Location selector
- Category selector
- Publish button
```

---

## 🛡️ SECURITY VERIFICATION

The system is protected at multiple levels:

1. **Frontend Check** (UX Prevention)

   - Show verification required message
   - Hide post form if not verified

2. **Backend RLS Policy** (Database Enforcement)

   - Even if frontend is bypassed
   - User cannot insert into community_posts without is_verified=true

3. **Admin Authentication** (Role-Based Access)
   - Only admins can manage verification
   - Admins must have admin_key = 'LOCALPING-ADMIN'

---

## 📞 DEPLOYMENT SUPPORT

If you encounter issues:

1. **SQL Error**: Check VERIFIED_SYSTEM_SETUP.sql line by line
2. **User Can't Post**: Verify user status in admin panel
3. **Can't Access Admin**: Check if user has admin_key set
4. **Verification Not Updating**: Clear browser cache and re-login

---

## 🎯 SUCCESS CRITERIA

System is working when:

- [ ] SQL migrations execute without errors
- [ ] Unverified user sees "Verification Required" on /post
- [ ] Verified user can access post form
- [ ] Admin can see all users in verification panel
- [ ] Admin can click Verify/Unverify buttons
- [ ] Status changes reflect immediately
- [ ] Community posts only from verified users
- [ ] User verification status persists after logout/login

---

## 📈 MONITORING

After deployment, regularly check:

1. **Admin Panel**

   - How many users are verified?
   - Are verification requests reasonable?

2. **Community Quality**

   - Are posts from verified users higher quality?
   - User feedback on verification system

3. **Performance**
   - Any slowdown after adding indexes?
   - Check Supabase metrics

---

**Setup Time:** ~5-10 minutes
**Testing Time:** ~5 minutes
**Total Implementation:** ~15 minutes

Good luck! 🎉
