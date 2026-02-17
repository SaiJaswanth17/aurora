-- Migration: Fix Registration and Profile Policies
-- This migration updates the profiles table policies to allow unauthenticated access for username checks
-- and improves the new user trigger to handle username collisions gracefully.

-- 1. Update Profiles RLS Policy
-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Create more permissive policy for SELECT to allow username checks during registration
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  USING (true);

-- 2. Improve handle_new_user function to handle collisions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 1;
BEGIN
  -- Get base username from metadata or email
  base_username := COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1));
  final_username := base_username;

  -- Ensure username is unique for the profile
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = final_username) LOOP
    final_username := base_username || counter::TEXT;
    counter := counter + 1;
  END LOOP;

  -- Insert into profiles table
  INSERT INTO public.profiles (id, username, status, created_at)
  VALUES (
    NEW.id,
    final_username,
    'online',
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error and continue to avoid blocking user creation
  RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
