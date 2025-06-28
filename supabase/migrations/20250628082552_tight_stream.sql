/*
  # Fix Storage Delete Policies

  1. Storage Policies
    - Add DELETE policies for all storage buckets
    - Add UPDATE policies for storage objects
    - Ensure proper permissions for file management

  2. Security
    - Allow public delete operations on storage objects
    - Enable RLS on storage.objects if not already enabled
*/

-- Enable RLS on storage.objects (should already be enabled but let's make sure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create DELETE policies for all buckets
-- These policies allow anyone to delete objects from the storage buckets

-- Event photos bucket
CREATE POLICY "Allow public delete on event-photos bucket"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'event-photos');

-- Testimonials bucket
CREATE POLICY "Allow public delete on testimonials bucket"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'testimonials');

-- Partners bucket
CREATE POLICY "Allow public delete on partners bucket"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'partners');

-- Press articles bucket
CREATE POLICY "Allow public delete on press-articles bucket"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'press-articles');

-- Media highlights bucket
CREATE POLICY "Allow public delete on media-highlights bucket"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'media-highlights');

-- Initiatives bucket
CREATE POLICY "Allow public delete on initiatives bucket"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'initiatives');

-- Trainer documents bucket
CREATE POLICY "Allow public delete on trainer-documents bucket"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'trainer-documents');

-- Also add UPDATE policies in case they're needed for file operations
CREATE POLICY "Allow public update on event-photos bucket"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'event-photos')
  WITH CHECK (bucket_id = 'event-photos');

CREATE POLICY "Allow public update on testimonials bucket"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'testimonials')
  WITH CHECK (bucket_id = 'testimonials');

CREATE POLICY "Allow public update on partners bucket"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'partners')
  WITH CHECK (bucket_id = 'partners');

CREATE POLICY "Allow public update on press-articles bucket"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'press-articles')
  WITH CHECK (bucket_id = 'press-articles');

CREATE POLICY "Allow public update on media-highlights bucket"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'media-highlights')
  WITH CHECK (bucket_id = 'media-highlights');

CREATE POLICY "Allow public update on initiatives bucket"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'initiatives')
  WITH CHECK (bucket_id = 'initiatives');

CREATE POLICY "Allow public update on trainer-documents bucket"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'trainer-documents')
  WITH CHECK (bucket_id = 'trainer-documents');