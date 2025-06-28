/*
  # Add public CRUD policies for storage buckets

  Creates row level security policies for the following buckets:
    - event-photos
    - initiatives
    - media-highlights
    - partners
    - press-articles

  These policies allow anyone to insert, select, update and delete objects
  within each bucket.
*/

-- Policies for event-photos bucket
CREATE POLICY "Anyone can upload event photos" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'event-photos');

CREATE POLICY "Anyone can view event photos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'event-photos');

CREATE POLICY "Anyone can update event photos" ON storage.objects
  FOR UPDATE TO public
  USING (bucket_id = 'event-photos')
  WITH CHECK (bucket_id = 'event-photos');

CREATE POLICY "Anyone can delete event photos" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'event-photos');

-- Policies for initiatives bucket
CREATE POLICY "Anyone can upload initiatives" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'initiatives');

CREATE POLICY "Anyone can view initiatives" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'initiatives');

CREATE POLICY "Anyone can update initiatives" ON storage.objects
  FOR UPDATE TO public
  USING (bucket_id = 'initiatives')
  WITH CHECK (bucket_id = 'initiatives');

CREATE POLICY "Anyone can delete initiatives" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'initiatives');

-- Policies for media-highlights bucket
CREATE POLICY "Anyone can upload media highlights" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'media-highlights');

CREATE POLICY "Anyone can view media highlights" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'media-highlights');

CREATE POLICY "Anyone can update media highlights" ON storage.objects
  FOR UPDATE TO public
  USING (bucket_id = 'media-highlights')
  WITH CHECK (bucket_id = 'media-highlights');

CREATE POLICY "Anyone can delete media highlights" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'media-highlights');

-- Policies for partners bucket
CREATE POLICY "Anyone can upload partners" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'partners');

CREATE POLICY "Anyone can view partners" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'partners');

CREATE POLICY "Anyone can update partners" ON storage.objects
  FOR UPDATE TO public
  USING (bucket_id = 'partners')
  WITH CHECK (bucket_id = 'partners');

CREATE POLICY "Anyone can delete partners" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'partners');

-- Policies for press-articles bucket
CREATE POLICY "Anyone can upload press articles" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'press-articles');

CREATE POLICY "Anyone can view press articles" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'press-articles');

CREATE POLICY "Anyone can update press articles" ON storage.objects
  FOR UPDATE TO public
  USING (bucket_id = 'press-articles')
  WITH CHECK (bucket_id = 'press-articles');

CREATE POLICY "Anyone can delete press articles" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'press-articles');
