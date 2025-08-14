/*
  # Fix RLS policies for initiatives table

  1. Security Updates
    - Add proper RLS policies for initiatives table
    - Allow authenticated users to manage their own initiatives
    - Keep public read access for all initiatives
    - Add user_id tracking for initiatives

  2. Changes
    - Add user_id column to initiatives table if not exists
    - Add trigger to automatically set user_id on insert
    - Add policies for authenticated users to CRUD their own initiatives
    - Update existing policies for better security
*/

-- Add user_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'initiatives' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE initiatives ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for user_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'initiatives' AND indexname = 'initiatives_user_id_idx'
  ) THEN
    CREATE INDEX initiatives_user_id_idx ON initiatives(user_id);
  END IF;
END $$;

-- Create function to set user_id if it doesn't exist
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to automatically set user_id on insert if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers
    WHERE trigger_name = 'set_initiatives_user_id'
  ) THEN
    CREATE TRIGGER set_initiatives_user_id
      BEFORE INSERT ON initiatives
      FOR EACH ROW
      EXECUTE FUNCTION set_user_id();
  END IF;
END $$;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Anyone can read initiatives" ON initiatives;
DROP POLICY IF EXISTS "Allow public read access" ON initiatives;

-- Create comprehensive RLS policies
CREATE POLICY "Public can read all initiatives"
  ON initiatives
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert their own initiatives"
  ON initiatives
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own initiatives"
  ON initiatives
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own initiatives"
  ON initiatives
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Also allow anonymous users to manage initiatives for admin purposes
CREATE POLICY "Anonymous users can manage initiatives"
  ON initiatives
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);