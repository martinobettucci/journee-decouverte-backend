/*
  # Add ON UPDATE CASCADE to foreign key constraints

  1. Schema Changes
    - Drop and recreate foreign key constraints with ON UPDATE CASCADE
    - This allows workshop date updates to propagate to related tables
    
  2. Tables affected
    - workshop_trainers (workshop_date references workshop_passwords.date)
    - trainer_registrations (workshop_date references workshop_passwords.date)
    - workshop_guidelines (workshop_date references workshop_passwords.date)
    - contract_templates (workshop_date references workshop_passwords.date)
    - client_contracts (workshop_date references workshop_passwords.date)
*/

-- Drop existing foreign key constraints and recreate with CASCADE
ALTER TABLE workshop_trainers 
DROP CONSTRAINT IF EXISTS workshop_trainers_workshop_date_fkey;

ALTER TABLE workshop_trainers 
ADD CONSTRAINT workshop_trainers_workshop_date_fkey 
FOREIGN KEY (workshop_date) REFERENCES workshop_passwords(date) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- trainer_registrations
ALTER TABLE trainer_registrations 
DROP CONSTRAINT IF EXISTS trainer_registrations_workshop_date_fkey;

ALTER TABLE trainer_registrations 
ADD CONSTRAINT trainer_registrations_workshop_date_fkey 
FOREIGN KEY (workshop_date) REFERENCES workshop_passwords(date) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- workshop_guidelines  
ALTER TABLE workshop_guidelines 
DROP CONSTRAINT IF EXISTS workshop_guidelines_workshop_date_fkey;

ALTER TABLE workshop_guidelines 
ADD CONSTRAINT workshop_guidelines_workshop_date_fkey 
FOREIGN KEY (workshop_date) REFERENCES workshop_passwords(date) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- contract_templates
ALTER TABLE contract_templates 
DROP CONSTRAINT IF EXISTS contract_templates_workshop_date_fkey;

ALTER TABLE contract_templates 
ADD CONSTRAINT contract_templates_workshop_date_fkey 
FOREIGN KEY (workshop_date) REFERENCES workshop_passwords(date) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- client_contracts
ALTER TABLE client_contracts 
DROP CONSTRAINT IF EXISTS client_contracts_workshop_date_fkey;

ALTER TABLE client_contracts 
ADD CONSTRAINT client_contracts_workshop_date_fkey 
FOREIGN KEY (workshop_date) REFERENCES workshop_passwords(date) 
ON DELETE CASCADE ON UPDATE CASCADE;