/*
  # Add code sent flags for trainer and client codes

  1. Schema Changes
    - Add `code_sent` boolean column to `workshop_trainers` table with default false
    - Add `code_sent` boolean column to `client_contracts` table with default false

  2. Documentation
    - Add comments explaining the purpose of these columns
*/

-- Add code_sent flag to workshop_trainers table
ALTER TABLE workshop_trainers 
ADD COLUMN IF NOT EXISTS code_sent boolean NOT NULL DEFAULT false;

-- Add code_sent flag to client_contracts table  
ALTER TABLE client_contracts 
ADD COLUMN IF NOT EXISTS code_sent boolean NOT NULL DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN workshop_trainers.code_sent IS 'Indique si le code formateur a été envoyé manuellement';
COMMENT ON COLUMN client_contracts.code_sent IS 'Indique si le code de signature client a été envoyé manuellement';