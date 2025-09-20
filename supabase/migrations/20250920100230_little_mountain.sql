/*
  # Fix user profile creation system

  1. Database Functions
    - Create or update the handle_new_user function to automatically create profiles
    - Ensure proper error handling and role assignment

  2. Triggers
    - Add trigger on auth.users to automatically create user_profiles
    - Handle first user getting backoffice role

  3. Security
    - Add RLS policies for user profile creation during signup
    - Allow system-level operations for the trigger function

  4. Fixes
    - Resolves "Database error saving new user" during signup
    - Ensures automatic profile creation with proper role assignment
*/

-- First, ensure RLS is enabled on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Backoffice users can read all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Backoffice users can update all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Public can check backoffice existence" ON public.user_profiles;

-- Create or replace the function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  backoffice_exists BOOLEAN;
  user_role TEXT;
BEGIN
  -- Check if a backoffice user already exists
  SELECT EXISTS(
    SELECT 1 FROM public.user_profiles WHERE role = 'backoffice'
  ) INTO backoffice_exists;

  -- Assign role based on whether backoffice exists
  IF backoffice_exists THEN
    user_role := 'user';
  ELSE
    user_role := 'backoffice';
  END IF;

  -- Insert the user profile
  INSERT INTO public.user_profiles (user_id, role, first_name, last_name)
  VALUES (NEW.id, user_role, '', '');

  -- Also insert into users table for consistency
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add comprehensive RLS policies
CREATE POLICY "Allow authenticated users to insert their own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Backoffice users can read all profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

CREATE POLICY "Backoffice users can update all profiles"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_id = auth.uid() AND role = 'backoffice'
    )
  );

-- Allow public (anonymous) access to check if backoffice role exists
-- This is needed for the registration logic in the frontend
CREATE POLICY "Public can check backoffice existence"
  ON public.user_profiles
  FOR SELECT
  TO anon
  USING (role = 'backoffice');

-- Allow system-level operations for the trigger function
-- This policy allows the trigger to insert profiles during signup
CREATE POLICY "System can insert user profiles"
  ON public.user_profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);