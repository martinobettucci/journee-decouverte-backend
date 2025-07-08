/*
  # Add DELETE policy for event_photos table

  1. Security Changes
    - Add DELETE policy for `event_photos` table
    - Allow anyone to delete event photos (consistent with other admin tables)
*/

-- Add DELETE policy for event_photos
CREATE POLICY "Anyone can delete event_photos"
  ON event_photos
  FOR DELETE
  TO public
  USING (true);