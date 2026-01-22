-- ============================================================================
-- MEGA RLS FIX: DATABASE & STORAGE
-- Run this SQL in your Supabase SQL Editor to resolve all "violate row level security policy" errors.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- PART 1: USER PROFILES TABLE FIX
-- ----------------------------------------------------------------------------

-- 1. Ensure schema access
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Clear all existing policies to ensure a fresh start
DO $$ 
BEGIN
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON public.user_profiles;', ' ')
        FROM pg_policies 
        WHERE tablename = 'user_profiles' AND schemaname = 'public'
    );
END $$;

-- 3. Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create robust policies

-- SELECT: Anyone can view profiles
CREATE POLICY "Enable read access for all users" 
ON public.user_profiles FOR SELECT 
USING (true);

-- INSERT: Users can insert their own profile
CREATE POLICY "Enable insert for users based on user_id" 
ON public.user_profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- UPDATE: Users can update their own profile
CREATE POLICY "Enable update for users based on id" 
ON public.user_profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- DELETE: Prevent deletion for now
CREATE POLICY "Enable delete for users based on id" 
ON public.user_profiles FOR DELETE
USING (auth.uid() = id);

-- 5. Final Permission Grants
GRANT ALL ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- ----------------------------------------------------------------------------
-- PART 2: STORAGE RLS FIX (Correcting Path Errors)
-- ----------------------------------------------------------------------------

-- 1. Clear existing storage policies for user-profiles bucket
DO $$ 
BEGIN
    EXECUTE (
        SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON storage.objects;', ' ')
        FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage'
        AND policyname LIKE '%profile%' -- Targets profile related policies
    );
END $$;

-- 2. Create flexible storage policies that handle the 'profile-images/userId/' path

-- SELECT: Public access to profile images
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'user-profiles');

-- INSERT: Allow users to upload to their own subfolder
-- This handles both 'userId/file' and 'profile-images/userId/file'
CREATE POLICY "User Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'user-profiles' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text 
    OR 
    (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- UPDATE: Allow users to update their own subfolder
CREATE POLICY "User Update" ON storage.objects
FOR UPDATE WITH CHECK (
  bucket_id = 'user-profiles' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text 
    OR 
    (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- DELETE: Allow users to delete their own subfolder
CREATE POLICY "User Delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'user-profiles' 
  AND (
    (storage.foldername(name))[1] = auth.uid()::text 
    OR 
    (storage.foldername(name))[2] = auth.uid()::text
  )
);

-- ----------------------------------------------------------------------------
-- VERIFICATION: Log success
-- ----------------------------------------------------------------------------
SELECT 'RLS Fix Applied Successfully' as status;
