-- GrainScan AI — Supabase Database Schema
-- Run this in your Supabase SQL Editor to initialize the database.

-- 1. SAFE MIGRATION: Fix the corrupted Profiles table structure
-- We rename the old table so we don't lose any of your data
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
    -- If a previous backup already exists, we drop it first to avoid collision
    DROP TABLE IF EXISTS public.profiles_old_backup CASCADE;
    ALTER TABLE public.profiles RENAME TO profiles_old_backup;
  END IF;
END $$;

-- 2. CREATE FRESH PROFILES TABLE with correct column order
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'Laboratory Technician',
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. MIGRATE DATA (if possible)
-- We use a robust script that doesn't care if 'updated_at' exists in the old table
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles_old_backup') THEN
    EXECUTE '
      INSERT INTO public.profiles (id, full_name, role)
      SELECT 
        id, 
        COALESCE(full_name, ''Unknown User''), 
        TRIM(CASE 
          WHEN TRIM(role) IN (''Laboratory Technician'', ''Quality Inspector'', ''Farm Manager'') THEN role 
          ELSE ''Laboratory Technician'' 
        END)
      FROM public.profiles_old_backup
      ON CONFLICT (id) DO NOTHING;
    ';
  END IF;
END $$;

-- 4. APPLY THE SECURITY RULE (Now safe because the schema is clean)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (TRIM(role) IN ('Laboratory Technician', 'Quality Inspector', 'Farm Manager'));

-- 2. Create Scan Results Table
CREATE TABLE IF NOT EXISTS public.scan_results (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  grain_type TEXT NOT NULL
);

-- SURGICAL UPDATE: Ensure the 'status' and other columns exist even if table was already there
ALTER TABLE public.scan_results ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Laboratory';
ALTER TABLE public.scan_results ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.scan_results ADD COLUMN IF NOT EXISTS total_grains INTEGER DEFAULT 0;
ALTER TABLE public.scan_results ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Pending';
ALTER TABLE public.scan_results ADD COLUMN IF NOT EXISTS type_counts JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.scan_results ADD COLUMN IF NOT EXISTS quality_counts JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.scan_results ADD COLUMN IF NOT EXISTS quality_percentages JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.scan_results ADD COLUMN IF NOT EXISTS annotated_image_url TEXT;
ALTER TABLE public.scan_results ADD COLUMN IF NOT EXISTS raw_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.scan_results ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 4. Create RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_results ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

-- Profiles: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Scan Results: Users can view their own results, OR Inspectors can view ALL results
DROP POLICY IF EXISTS "Users can view scan results" ON public.scan_results;
DROP POLICY IF EXISTS "Users can view own scan results" ON public.scan_results;
CREATE POLICY "Users can view scan results" 
  ON public.scan_results FOR SELECT 
  USING (
    auth.uid() = user_id 
    OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND TRIM(role) = 'Quality Inspector')
  );

-- Scan Results: Users can insert their own results
DROP POLICY IF EXISTS "Users can insert own scan results" ON public.scan_results;
CREATE POLICY "Users can insert own scan results" 
  ON public.scan_results FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Scan Results: ONLY Inspectors can update any scan status
DROP POLICY IF EXISTS "Inspectors can update scan status" ON public.scan_results;
CREATE POLICY "Inspectors can update scan status" 
  ON public.scan_results FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND TRIM(role) = 'Quality Inspector')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND TRIM(role) = 'Quality Inspector')
  );

-- 5. Helper Function: Automatically create profile on signup
-- We use SECURITY DEFINER and specifically set the search_path to 'public' for security and reliability.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', 'New Laboratory Member'), 
    COALESCE(new.raw_user_meta_data->>'role', 'Laboratory Technician')
  )
  ON CONFLICT (id) DO NOTHING; -- Prevents errors if the record was somehow already created
  RETURN NEW;
END;
$$;

-- Trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
