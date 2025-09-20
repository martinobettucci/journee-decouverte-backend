/*
  # Remove link between initiatives and users

  1. Changes
    - Drop foreign key constraint between initiatives and users
    - Drop user_id column from initiatives table
    - Drop trigger that sets user_id automatically
    - Drop user_id index

  2. Security
    - Keep existing RLS policies (they don't depend on user_id)
*/

-- Drop the trigger first
DROP TRIGGER IF EXISTS set_initiatives_user_id ON initiatives;

-- Drop the foreign key constraint
ALTER TABLE initiatives DROP CONSTRAINT IF EXISTS initiatives_user_id_fkey;

-- Drop the index
DROP INDEX IF EXISTS initiatives_user_id_idx;

-- Drop the user_id column
ALTER TABLE initiatives DROP COLUMN IF EXISTS user_id;