-- ============================================
-- VERIFIED SYSTEM IMPLEMENTATION
-- ============================================

-- 1. Add verified column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 2. Create index for faster verification checks
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified);

-- 3. Drop existing RLS policies on community_posts (to recreate them)
DROP POLICY IF EXISTS "Users can insert their own community posts" ON community_posts;
DROP POLICY IF EXISTS "Only verified users can insert community posts" ON community_posts;
DROP POLICY IF EXISTS "Users can update their own community posts" ON community_posts;
DROP POLICY IF EXISTS "Users can delete their own community posts" ON community_posts;

-- 4. Recreate all RLS policies for community_posts
CREATE POLICY "Community posts are viewable by all authenticated users" ON community_posts
  FOR SELECT USING (auth.role() = 'authenticated');

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

CREATE POLICY "Users can update their own community posts" ON community_posts
  FOR UPDATE USING (auth.uid() = author_id);

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

-- 6. Create a view for verified users count
CREATE OR REPLACE VIEW verified_users_count AS
SELECT COUNT(*) as total_verified FROM profiles WHERE is_verified = true;
