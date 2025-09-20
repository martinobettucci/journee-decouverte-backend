/*
  # Fix RLS policies for public entities

  1. Updated Tables
    - `initiatives` - Allow authenticated users to modify, public read access
    - `faqs` - Allow authenticated users to modify, public read access  
    - `testimonials` - Allow authenticated users to modify, public read access
    - `press_articles` - Allow authenticated users to modify, public read access
    - `partners` - Allow authenticated users to modify, public read access
    - `media_highlights` - Allow authenticated users to modify, public read access
    - `events` - Allow authenticated users to modify, public read access
    - `event_photos` - Allow authenticated users to modify, public read access

  2. Security
    - Drop existing policies that allow anonymous modifications
    - Create new policies restricting modifications to authenticated users only
    - Maintain public read access for all entities
*/

-- Drop existing policies and recreate with proper restrictions

-- INITIATIVES
DROP POLICY IF EXISTS "Anonymous users can manage initiatives" ON initiatives;
DROP POLICY IF EXISTS "Authenticated users can delete their own initiatives" ON initiatives;
DROP POLICY IF EXISTS "Authenticated users can insert their own initiatives" ON initiatives;
DROP POLICY IF EXISTS "Authenticated users can update their own initiatives" ON initiatives;
DROP POLICY IF EXISTS "Public can read all initiatives" ON initiatives;

CREATE POLICY "Public can read initiatives"
  ON initiatives
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert initiatives"
  ON initiatives
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update initiatives"
  ON initiatives
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete initiatives"
  ON initiatives
  FOR DELETE
  TO authenticated
  USING (true);

-- FAQS
DROP POLICY IF EXISTS "Anyone can read faqs" ON faqs;

CREATE POLICY "Public can read faqs"
  ON faqs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert faqs"
  ON faqs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update faqs"
  ON faqs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete faqs"
  ON faqs
  FOR DELETE
  TO authenticated
  USING (true);

-- TESTIMONIALS
DROP POLICY IF EXISTS "Anyone can delete testimonials" ON testimonials;
DROP POLICY IF EXISTS "Anyone can insert testimonials" ON testimonials;
DROP POLICY IF EXISTS "Anyone can select testimonials" ON testimonials;
DROP POLICY IF EXISTS "Anyone can update testimonials" ON testimonials;
DROP POLICY IF EXISTS "Public read testimonials" ON testimonials;

CREATE POLICY "Public can read testimonials"
  ON testimonials
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert testimonials"
  ON testimonials
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update testimonials"
  ON testimonials
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete testimonials"
  ON testimonials
  FOR DELETE
  TO authenticated
  USING (true);

-- PRESS ARTICLES
DROP POLICY IF EXISTS "Allow public read access" ON press_articles;

CREATE POLICY "Public can read press articles"
  ON press_articles
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert press articles"
  ON press_articles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update press articles"
  ON press_articles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete press articles"
  ON press_articles
  FOR DELETE
  TO authenticated
  USING (true);

-- PARTNERS
DROP POLICY IF EXISTS "Allow public read access" ON partners;
DROP POLICY IF EXISTS "Anyone can delete partners" ON partners;
DROP POLICY IF EXISTS "Anyone can insert partners" ON partners;
DROP POLICY IF EXISTS "Anyone can update partners" ON partners;

CREATE POLICY "Public can read partners"
  ON partners
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert partners"
  ON partners
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update partners"
  ON partners
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete partners"
  ON partners
  FOR DELETE
  TO authenticated
  USING (true);

-- MEDIA HIGHLIGHTS
DROP POLICY IF EXISTS "Anyone can delete media_highlights" ON media_highlights;
DROP POLICY IF EXISTS "Anyone can insert media_highlights" ON media_highlights;
DROP POLICY IF EXISTS "Anyone can read media_highlights" ON media_highlights;
DROP POLICY IF EXISTS "Anyone can select media_highlights" ON media_highlights;
DROP POLICY IF EXISTS "Anyone can update media_highlights" ON media_highlights;

CREATE POLICY "Public can read media highlights"
  ON media_highlights
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert media highlights"
  ON media_highlights
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update media highlights"
  ON media_highlights
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete media highlights"
  ON media_highlights
  FOR DELETE
  TO authenticated
  USING (true);

-- EVENTS
CREATE POLICY "Public can read events"
  ON events
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert events"
  ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update events"
  ON events
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete events"
  ON events
  FOR DELETE
  TO authenticated
  USING (true);

-- EVENT PHOTOS
DROP POLICY IF EXISTS "Anyone can delete event_photos" ON event_photos;
DROP POLICY IF EXISTS "Anyone can read event_photos" ON event_photos;

CREATE POLICY "Public can read event photos"
  ON event_photos
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Authenticated users can insert event photos"
  ON event_photos
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update event photos"
  ON event_photos
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete event photos"
  ON event_photos
  FOR DELETE
  TO authenticated
  USING (true);