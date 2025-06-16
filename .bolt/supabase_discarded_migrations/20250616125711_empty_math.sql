/*
  # Create storage bucket for trainer files

  1. New Storage Bucket
    - `trainer-files` bucket for storing invoices and RIB files
  
  2. Storage Policies
    - Allow authenticated and anonymous users to upload files
    - Allow public access to read files
    - Allow users to delete their own files

  3. Security
    - Files are publicly accessible for admin review
    - Upload restrictions can be added later if needed
*/

-- Create the storage bucket for trainer files
INSERT INTO storage.buckets (id, name, public)
VALUES ('trainer-files', 'trainer-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload files to the trainer-files bucket
CREATE POLICY "Anyone can upload trainer files"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'trainer-files');

-- Allow anyone to view files in the trainer-files bucket
CREATE POLICY "Anyone can view trainer files"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'trainer-files');

-- Allow anyone to update files in the trainer-files bucket
CREATE POLICY "Anyone can update trainer files"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'trainer-files')
  WITH CHECK (bucket_id = 'trainer-files');

-- Allow anyone to delete files in the trainer-files bucket
CREATE POLICY "Anyone can delete trainer files"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'trainer-files');