/*
  # Create client contracts table

  1. New Tables
    - `client_contracts`
      - `id` (uuid, primary key)
      - `workshop_date` (date, foreign key to workshop_passwords.date)
      - `contract_template_id` (uuid, foreign key to contract_templates.id)
      - `client_company_name` (text)
      - `client_representative_name` (text)
      - `client_address` (text)
      - `client_email` (text)
      - `signature_code` (text, unique)
      - `is_signed` (boolean, default false)
      - `signed_at` (timestamptz, nullable)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `client_contracts` table
    - Add policies for public access (insert, select, update, delete)

  3. Constraints
    - Unique constraint on workshop_date (one contract per workshop)
    - Email validation constraint
    - Foreign key constraints for referential integrity
*/

CREATE TABLE IF NOT EXISTS client_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_date date NOT NULL REFERENCES workshop_passwords(date) ON DELETE CASCADE,
  contract_template_id uuid NOT NULL REFERENCES contract_templates(id) ON DELETE CASCADE,
  client_company_name text NOT NULL,
  client_representative_name text NOT NULL,
  client_address text NOT NULL,
  client_email text NOT NULL,
  signature_code text NOT NULL UNIQUE,
  is_signed boolean NOT NULL DEFAULT false,
  signed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add unique constraint for one contract per workshop
ALTER TABLE client_contracts ADD CONSTRAINT client_contracts_workshop_date_unique UNIQUE (workshop_date);

-- Add email validation constraint
ALTER TABLE client_contracts ADD CONSTRAINT client_contracts_email_check 
  CHECK (client_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Enable RLS
ALTER TABLE client_contracts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is an admin interface)
CREATE POLICY "Anyone can insert client contracts"
  ON client_contracts
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read client contracts"
  ON client_contracts
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can update client contracts"
  ON client_contracts
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete client contracts"
  ON client_contracts
  FOR DELETE
  TO public
  USING (true);