/*
  # Fix trainer storage bucket and RLS policies

  1. Storage Setup
    - Create `trainer-documents` bucket (matching the code)
    - Add proper storage policies for file operations
    
  2. RLS Policies
    - Ensure DELETE policies exist for trainer_registrations
    - Add missing policies if needed

  3. Security
    - Allow public access for admin operations
    - Enable file deletion for cleanup
*/

-- Create the correct storage bucket for trainer documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('trainer-documents', 'trainer-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for trainer-documents bucket
CREATE POLICY "Anyone can upload trainer documents"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'trainer-documents');

CREATE POLICY "Anyone can view trainer documents"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'trainer-documents');

CREATE POLICY "Anyone can update trainer documents"
  ON storage.objects
  FOR UPDATE
  TO public
  USING (bucket_id = 'trainer-documents')
  WITH CHECK (bucket_id = 'trainer-documents');

CREATE POLICY "Anyone can delete trainer documents"
  ON storage.objects
  FOR DELETE
  TO public
  USING (bucket_id = 'trainer-documents');

-- Ensure DELETE policy exists for trainer_registrations
DO $$
BEGIN
  -- Check if DELETE policy already exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'trainer_registrations' 
    AND policyname = 'Anyone can delete trainer registrations'
  ) THEN
    CREATE POLICY "Anyone can delete trainer registrations"
      ON trainer_registrations
      FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;