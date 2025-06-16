/*
  # Add contract types to distinguish trainer and client contracts

  1. Schema Changes
    - Add `type` column to `contract_templates` table
    - Add check constraint for valid types
    - Update existing contracts to be 'trainer' type by default

  2. Data Migration
    - Set existing contracts as 'trainer' type
*/

-- Add contract type column
ALTER TABLE contract_templates 
ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'trainer';

-- Add constraint for valid contract types
ALTER TABLE contract_templates 
ADD CONSTRAINT contract_templates_type_check 
CHECK (type IN ('trainer', 'client'));

-- Update the column to not have a default anymore (force explicit choice)
ALTER TABLE contract_templates 
ALTER COLUMN type DROP DEFAULT;