/*
  # Add abandoned status for trainers

  1. Schema Changes
    - Add `is_abandoned` boolean column to `workshop_trainers` table with default false

  2. Documentation
    - Add comment explaining the purpose of this column
*/

-- Add is_abandoned flag to workshop_trainers table
ALTER TABLE workshop_trainers 
ADD COLUMN IF NOT EXISTS is_abandoned boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN workshop_trainers.is_abandoned IS 'Indique si le formateur a abandonné son engagement (ne participe plus à l''atelier)';