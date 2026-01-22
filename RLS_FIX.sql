-- ============================================================================
-- RLS FIX: USER PROFILES TABLE
-- Run this SQL in your Supabase SQL Editor to fix the "new row violates row level security policy" error.
-- ============================================================================

-- 1. Ensure RLS is enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "profiles_view_all" ON public.user_profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.user_profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "profiles_no_delete" ON public.user_profiles;

-- 3. Create robust policies

-- Anyone can view all profiles
CREATE POLICY "profiles_view_all" ON public.user_profiles 
FOR SELECT USING (true);

-- Authenticated users can insert their own profile row
CREATE POLICY "profiles_insert_own" ON public.user_profiles 
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- Authenticated users can update their own profile row
-- Both USING and WITH CHECK are required for robust validation
CREATE POLICY "profiles_update_own" ON public.user_profiles 
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Users cannot delete their profile (security measure)
CREATE POLICY "profiles_no_delete" ON public.user_profiles 
FOR DELETE TO authenticated
USING (false);

-- 4. Verify table permissions
-- Grant necessary permissions to the authenticated role
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
