/*
  # Fix infinite recursion in user_profiles RLS policies

  1. Problem
    - The backoffice policies were creating infinite recursion by querying user_profiles within user_profiles policies
    - This caused circular dependency when checking if a user has backoffice role

  2. Solution
    - Remove the recursive backoffice policies that query user_profiles table within user_profiles policies
    - Keep simple, non-recursive policies for basic user access
    - Add a safe policy for checking backoffice existence without recursion
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow authenticated users to insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Backoffice users can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Backoffice users can update all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public can check backoffice existence" ON user_profiles;
DROP POLICY IF EXISTS "System can insert user profiles" ON user_profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow authenticated users to insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Safe policy for checking backoffice existence (no recursion)
CREATE POLICY "Public can check backoffice existence"
  ON user_profiles
  FOR SELECT
  TO anon
  USING (role = 'backoffice');

-- System policy for triggers and functions
CREATE POLICY "System can insert user profiles"
  ON user_profiles
  FOR INSERT
  TO service_role
  WITH CHECK (true);