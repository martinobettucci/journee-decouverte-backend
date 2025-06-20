/*
  # Add partners table and storage bucket

  1. Function
    - Create validate_resources() to validate JSON resources
  2. Table Definition
    - Create partners table with constraints
    - Trigger to run validation
  3. Storage
    - Create partners bucket with public policies
*/

-- Function to validate resources JSON structure
CREATE OR REPLACE FUNCTION validate_resources()
RETURNS TRIGGER AS $$
DECLARE
  item jsonb;
BEGIN
  IF NEW.resources IS NULL THEN
    RETURN NEW;
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(NEW.resources)
  LOOP
    IF NOT (item ? 'url') OR NOT (item ? 'description') THEN
      RAISE EXCEPTION 'Chaque ressource doit contenir les champs url et description';
    END IF;
    IF NOT (item->>'url' ~* '^https?://') THEN
      RAISE EXCEPTION 'URL invalide dans resources: %', item->>'url';
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Partners table
CREATE TABLE IF NOT EXISTS public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  logo_url text NOT NULL,
  website_url text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  collaboration_date date NULL,
  specializations text[] NULL,
  resources jsonb NULL,
  locations text[] NULL,
  collaboration_status text NULL,
  CONSTRAINT collaboration_status_check CHECK (
    collaboration_status IS NULL OR
    collaboration_status ~ '^[A-Za-zÀ-ÿ]+ [0-9]{4}$'
  )
);

CREATE TRIGGER validate_resources_trigger
BEFORE INSERT OR UPDATE ON public.partners
FOR EACH ROW EXECUTE FUNCTION validate_resources();

-- Storage bucket for partner logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('partners', 'partners', true)
ON CONFLICT (id) DO NOTHING;

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
