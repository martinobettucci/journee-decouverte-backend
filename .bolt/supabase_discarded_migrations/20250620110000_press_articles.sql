/*
  # Add press_articles table and storage bucket

  1. New Table
    - press_articles (id, publication, logo_url, title, url, date, created_at, featured)
  2. Index
    - press_articles_featured_date_idx on (featured desc, date desc)
  3. Storage
    - Create `press-articles` bucket
    - Allow public file operations
  4. Security
    - Enable RLS and add public policies for CRUD
*/

CREATE TABLE IF NOT EXISTS press_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication text NOT NULL,
  logo_url text NOT NULL,
  title text NOT NULL,
  url text NOT NULL,
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  featured boolean DEFAULT false
);

CREATE INDEX IF NOT EXISTS press_articles_featured_date_idx
  ON press_articles (featured DESC, date DESC);

ALTER TABLE press_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can select press_articles" ON press_articles
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Anyone can insert press_articles" ON press_articles
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update press_articles" ON press_articles
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete press_articles" ON press_articles
  FOR DELETE TO public
  USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('press-articles', 'press-articles', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload press-articles" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'press-articles');

CREATE POLICY "Anyone can view press-articles" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'press-articles');

CREATE POLICY "Anyone can update press-articles" ON storage.objects
  FOR UPDATE TO public
  USING (bucket_id = 'press-articles')
  WITH CHECK (bucket_id = 'press-articles');

CREATE POLICY "Anyone can delete press-articles" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'press-articles');
