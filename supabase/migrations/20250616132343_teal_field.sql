/*
  # Add contract templates system

  1. New Tables
    - `contract_templates`
      - `id` (uuid, primary key)
      - `workshop_date` (date, foreign key)
      - `name` (text)
      - `content_markdown` (text)
      - `created_at` (timestamp)
    
    - `contract_assignments`
      - `id` (uuid, primary key)
      - `trainer_id` (uuid, foreign key to workshop_trainers)
      - `contract_template_id` (uuid, foreign key to contract_templates)
      - `created_at` (timestamp)

  2. Additional columns for trainer_registrations
    - Company information fields for contract placeholders
    - Legal representative information

  3. Security
    - Enable RLS on new tables
    - Add policies for public access (consistent with existing tables)
*/

-- Create contract_templates table
CREATE TABLE IF NOT EXISTS contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_date date NOT NULL,
  name text NOT NULL,
  content_markdown text NOT NULL,
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (workshop_date) REFERENCES workshop_passwords(date) ON DELETE CASCADE
);

-- Create contract_assignments table
CREATE TABLE IF NOT EXISTS contract_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id uuid NOT NULL,
  contract_template_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  FOREIGN KEY (trainer_id) REFERENCES workshop_trainers(id) ON DELETE CASCADE,
  FOREIGN KEY (contract_template_id) REFERENCES contract_templates(id) ON DELETE CASCADE,
  UNIQUE(trainer_id) -- Each trainer can only have one contract assigned
);

-- Add contract-related fields to trainer_registrations
DO $$
BEGIN
  -- Company information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainer_registrations' AND column_name = 'company_name') THEN
    ALTER TABLE trainer_registrations ADD COLUMN company_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainer_registrations' AND column_name = 'company_legal_form') THEN
    ALTER TABLE trainer_registrations ADD COLUMN company_legal_form text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainer_registrations' AND column_name = 'company_capital') THEN
    ALTER TABLE trainer_registrations ADD COLUMN company_capital text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainer_registrations' AND column_name = 'company_rcs') THEN
    ALTER TABLE trainer_registrations ADD COLUMN company_rcs text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainer_registrations' AND column_name = 'company_rcs_number') THEN
    ALTER TABLE trainer_registrations ADD COLUMN company_rcs_number text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainer_registrations' AND column_name = 'company_address') THEN
    ALTER TABLE trainer_registrations ADD COLUMN company_address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainer_registrations' AND column_name = 'company_short_name') THEN
    ALTER TABLE trainer_registrations ADD COLUMN company_short_name text;
  END IF;
  
  -- Legal representative information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainer_registrations' AND column_name = 'representative_name') THEN
    ALTER TABLE trainer_registrations ADD COLUMN representative_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainer_registrations' AND column_name = 'representative_function') THEN
    ALTER TABLE trainer_registrations ADD COLUMN representative_function text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainer_registrations' AND column_name = 'representative_email') THEN
    ALTER TABLE trainer_registrations ADD COLUMN representative_email text;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_assignments ENABLE ROW LEVEL SECURITY;

-- Add policies for contract_templates
CREATE POLICY "Anyone can read contract templates"
  ON contract_templates
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert contract templates"
  ON contract_templates
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update contract templates"
  ON contract_templates
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete contract templates"
  ON contract_templates
  FOR DELETE
  TO public
  USING (true);

-- Add policies for contract_assignments
CREATE POLICY "Anyone can read contract assignments"
  ON contract_assignments
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can insert contract assignments"
  ON contract_assignments
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update contract assignments"
  ON contract_assignments
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete contract assignments"
  ON contract_assignments
  FOR DELETE
  TO public
  USING (true);