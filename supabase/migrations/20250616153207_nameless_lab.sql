/*
  # Add client company registration field

  1. Schema Changes
    - Add `client_company_registration` column to `client_contracts` table
    - This field will store SIRET or NDA numbers for client companies

  2. Data Support
    - Support for placeholder [CLIENT_COMPANY_REGISTRATION] in contract templates
    - Validation for SIRET (14 digits) or NDA format
*/

-- Add client company registration column
ALTER TABLE client_contracts 
ADD COLUMN IF NOT EXISTS client_company_registration text;

-- Add constraint to validate SIRET (14 digits) or NDA format
ALTER TABLE client_contracts 
ADD CONSTRAINT client_contracts_registration_format_check 
CHECK (
  client_company_registration IS NULL OR 
  client_company_registration ~ '^(SIRET [0-9]{14}|NDA [A-Za-z0-9]+)$'
);