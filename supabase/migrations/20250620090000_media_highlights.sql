/*
  # Add media_highlights table and storage bucket

  1. New Table
    - media_highlights (uuid, title, media_name, media_logo, date, url, video_id, image_url, created_at)
  2. Storage
    - Create `media-highlights` bucket
    - Allow public file operations (insert, select, update, delete)
  3. Security
    - Enable RLS and add public policies for CRUD
*/

CREATE TABLE IF NOT EXISTS media_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  media_name text NOT NULL,
  media_logo text NOT NULL,
  date date NOT NULL,
  url text,
  video_id text,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE media_highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can select media_highlights" ON media_highlights
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Anyone can insert media_highlights" ON media_highlights
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update media_highlights" ON media_highlights
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete media_highlights" ON media_highlights
  FOR DELETE TO public
  USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('media-highlights', 'media-highlights', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload media-highlights" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'media-highlights');

CREATE POLICY "Anyone can view media-highlights" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'media-highlights');

CREATE POLICY "Anyone can update media-highlights" ON storage.objects
  FOR UPDATE TO public
  USING (bucket_id = 'media-highlights')
  WITH CHECK (bucket_id = 'media-highlights');

CREATE POLICY "Anyone can delete media-highlights" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'media-highlights');
