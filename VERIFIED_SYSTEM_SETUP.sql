-- ============================================
-- VERIFIED SYSTEM - COMPLETE SETUP
-- ============================================
-- This file contains all SQL needed to implement the verified user system

-- 1. Add verified column to profiles table (if not already added)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 2. Optional: Add author_verified to news table to cache verification status
ALTER TABLE community_posts
ADD COLUMN IF NOT EXISTS author_verified BOOLEAN DEFAULT false;

-- 3. Create index for faster verification checks
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_community_posts_author_verified ON community_posts(author_verified);

-- 4. Drop and recreate all RLS Policies for community_posts
DROP POLICY IF EXISTS "Users can insert their own community posts" ON community_posts;
DROP POLICY IF EXISTS "Only verified users can insert community posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update their own community posts" ON community_posts;
DROP POLICY IF EXISTS "Users can delete their own community posts" ON community_posts;
DROP POLICY IF EXISTS "Community posts are viewable by all authenticated users" ON community_posts;

-- Create INSERT policy - only verified users
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

-- Create SELECT policy 
CREATE POLICY "Community posts are viewable by all authenticated users" ON community_posts
  FOR SELECT USING (auth.role() = 'authenticated');

-- Create UPDATE policy
CREATE POLICY "Users can update their own community posts" ON community_posts
  FOR UPDATE USING (auth.uid() = author_id);

-- Create DELETE policy  
CREATE POLICY "Users can delete their own community posts" ON community_posts
  FOR DELETE USING (auth.uid() = author_id);

-- 5. Create admin function to verify/unverify users
CREATE OR REPLACE FUNCTION toggle_user_verification(user_id UUID, verified BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow admins to verify users
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND admin_key = 'LOCALPING-ADMIN'
  ) THEN
    UPDATE profiles 
    SET is_verified = verified 
    WHERE id = user_id;
  ELSE
    RAISE EXCEPTION 'Only admins can verify users';
  END IF;
END;
$$;

-- 6. Optional: Create a trigger to auto-update author_verified when posts are inserted
CREATE OR REPLACE FUNCTION set_author_verified()
RETURNS TRIGGER AS $$
BEGIN
  -- Set author_verified based on the author's verification status
  SELECT is_verified INTO NEW.author_verified 
  FROM profiles 
  WHERE id = NEW.author_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_community_posts_author_verified ON community_posts;
CREATE TRIGGER set_community_posts_author_verified
  BEFORE INSERT ON community_posts
  FOR EACH ROW
  EXECUTE FUNCTION set_author_verified();

-- 7. Optional: Create a view for verified users count
CREATE OR REPLACE VIEW verified_users_count AS
SELECT COUNT(*) as total_verified FROM profiles WHERE is_verified = true;

-- ============================================
-- TESTING QUERIES
-- ============================================

-- Check total users and verified users
SELECT 
  COUNT(*) as total_users,
  SUM(CASE WHEN is_verified THEN 1 ELSE 0 END) as verified_users
FROM profiles;

-- List all users with their verification status
SELECT id, name, email, is_verified, created_at
FROM profiles
ORDER BY created_at DESC;

-- Verify a specific user (replace UUID with actual user id)
-- UPDATE profiles SET is_verified = true WHERE id = 'your-user-id-here';

-- Unverify a specific user
-- UPDATE profiles SET is_verified = false WHERE id = 'your-user-id-here';
