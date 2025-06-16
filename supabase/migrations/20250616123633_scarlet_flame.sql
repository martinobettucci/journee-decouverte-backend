/*
  # Add INSERT policy for workshop_trainers table

  1. Security Changes
    - Add INSERT policy for `workshop_trainers` table
    - Allow anyone to create new trainer codes (similar to other tables in the schema)
  
  This fixes the RLS error preventing trainer code creation in the admin interface.
*/

CREATE POLICY "Anyone can insert workshop trainers"
  ON workshop_trainers
  FOR INSERT
  TO public
  WITH CHECK (true);