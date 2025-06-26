/*
  # Add payment tracking fields

  1. Schema Changes
    - Add `is_paid` boolean column to `trainer_registrations` table with default false
    - Add `payment_received` boolean column to `client_contracts` table with default false
*/

-- Add is_paid flag to trainer_registrations table
ALTER TABLE trainer_registrations
ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false;

-- Add payment_received flag to client_contracts table
ALTER TABLE client_contracts
ADD COLUMN IF NOT EXISTS payment_received boolean NOT NULL DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN trainer_registrations.is_paid IS 'Indique si la rémunération du formateur a été réglée';
COMMENT ON COLUMN client_contracts.payment_received IS 'Indique si le paiement du client a été encaissé';
