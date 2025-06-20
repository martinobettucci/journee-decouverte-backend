/*
  # Add testimonials storage bucket

  1. Storage Setup
    - Create `testimonials` bucket if not exists
    - Allow public file operations (insert, select, update, delete)
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonials', 'testimonials', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can upload testimonials" ON storage.objects
  FOR INSERT TO public
  WITH CHECK (bucket_id = 'testimonials');

CREATE POLICY "Anyone can view testimonials" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'testimonials');

CREATE POLICY "Anyone can update testimonials" ON storage.objects
  FOR UPDATE TO public
  USING (bucket_id = 'testimonials')
  WITH CHECK (bucket_id = 'testimonials');

CREATE POLICY "Anyone can delete testimonials" ON storage.objects
  FOR DELETE TO public
  USING (bucket_id = 'testimonials');
