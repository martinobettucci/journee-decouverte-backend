/*
  # Ensure event-photos storage bucket and policies

  1. Storage Setup
    - Ensure `event-photos` bucket exists
    - Add comprehensive storage policies for all operations
    
  2. Security
    - Allow public CRUD operations on event-photos storage
    - Enable proper file deletion permissions
*/

-- Ensure the event-photos bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-photos', 'event-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies to avoid conflicts and recreate them
DROP POLICY IF EXISTS "Anyone can upload event photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view event photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update event photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete event photos" ON storage.objects;

-- Comprehensive storage policies for event-photos bucket
CREATE POLICY "Public can insert event photos"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'event-photos');

CREATE POLICY "Public can select event photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'event-photos');

CREATE POLICY "Public can update event photos"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'event-photos')
  WITH CHECK (bucket_id = 'event-photos');

CREATE POLICY "Public can delete event photos"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'event-photos');