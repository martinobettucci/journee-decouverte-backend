/*
  # Add disabled field to media highlights

  1. Schema Changes
    - Add `disabled` column to `media_highlights` table
    - Default value: false (enabled by default)
    - Boolean type for simple enable/disable toggle

  2. Security
    - No RLS policy changes needed (existing policies cover the new field)
    - Field inherits existing permissions for CRUD operations

  3. Notes
    - Disabled items can be filtered out in queries when needed
    - Maintains backward compatibility with existing data
*/

-- Add disabled field to media_highlights table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'media_highlights' AND column_name = 'disabled'
  ) THEN
    ALTER TABLE media_highlights ADD COLUMN disabled boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Create index for efficient filtering of enabled/disabled items
CREATE INDEX IF NOT EXISTS media_highlights_disabled_idx ON media_highlights (disabled, date DESC);