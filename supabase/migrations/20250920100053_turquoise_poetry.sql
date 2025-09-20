/*
  # Fix user profiles RLS policy for signup

  1. Security Changes
    - Add policy to allow authenticated users to insert their own profiles
    - This fixes the "Database error saving new user" issue during signup
*/

-- Add policy to allow authenticated users to insert their own profiles
CREATE POLICY "Allow authenticated users to insert their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);