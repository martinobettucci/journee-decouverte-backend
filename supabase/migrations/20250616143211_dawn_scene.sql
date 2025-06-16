/*
  # Fix Workshop Passwords Policies

  1. Security Policies
    - Add missing policies for INSERT, UPDATE, and DELETE operations on workshop_passwords
    - Allow public access for admin interface operations
*/

-- Add missing policies for workshop_passwords table
CREATE POLICY "Anyone can insert workshop passwords"
  ON workshop_passwords
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update workshop passwords"
  ON workshop_passwords
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete workshop passwords"
  ON workshop_passwords
  FOR DELETE
  TO public
  USING (true);