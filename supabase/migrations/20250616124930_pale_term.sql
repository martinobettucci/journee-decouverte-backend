/*
  # Add missing RLS policies for workshop_guidelines table

  1. Security Changes
    - Add policy for anyone to insert workshop guidelines
    - Add policy for anyone to update workshop guidelines
    
  This fixes the RLS policy violation when trying to create or edit workshop guidelines.
*/

-- Allow anyone to insert workshop guidelines
CREATE POLICY "Anyone can insert workshop guidelines"
  ON workshop_guidelines
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Allow anyone to update workshop guidelines
CREATE POLICY "Anyone can update workshop guidelines"
  ON workshop_guidelines
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);