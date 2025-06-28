/*
  # Add CRUD policies for partners table

  1. Security Updates
    - Add INSERT policy to allow creating new partners
    - Add UPDATE policy to allow modifying partners  
    - Add DELETE policy to allow removing partners
    
  These policies match the pattern used by other admin tables in the system
  that allow public CRUD operations for admin dashboard functionality.
*/

-- Add INSERT policy for partners
CREATE POLICY "Anyone can insert partners"
  ON partners
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Add UPDATE policy for partners  
CREATE POLICY "Anyone can update partners"
  ON partners
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Add DELETE policy for partners
CREATE POLICY "Anyone can delete partners"
  ON partners
  FOR DELETE
  TO public
  USING (true);