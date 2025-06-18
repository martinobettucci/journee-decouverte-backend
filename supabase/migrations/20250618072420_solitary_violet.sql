/*
  # Add contract_accepted field to trainer_registrations

  1. Schema Changes
    - Add `contract_accepted` boolean column to `trainer_registrations` table
    - Default to false for existing registrations
    - Add comment for documentation

  2. Purpose
    - Track whether a trainer has formally accepted their contract
    - Prevent modification of contract assignments once accepted
*/

-- Add contract_accepted field to trainer_registrations
ALTER TABLE trainer_registrations 
ADD COLUMN IF NOT EXISTS contract_accepted boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN trainer_registrations.contract_accepted IS 'Indique si le formateur a formellement accepté son contrat (empêche la modification de l''affectation)';