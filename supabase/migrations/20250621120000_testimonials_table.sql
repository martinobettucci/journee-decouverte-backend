/*
  # Create testimonials table and policies

  1. Table
    - testimonials
      - id uuid primary key
      - partner_name text not null
      - quote text not null
      - rating integer not null default 5
      - "order" integer not null default 0
      - logo_url text not null
      - created_at timestamptz default now()

  2. Security
    - Enable RLS
    - Add policies for public access (insert, select, update, delete)
*/

CREATE TABLE IF NOT EXISTS testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name text NOT NULL,
  quote text NOT NULL,
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  "order" integer NOT NULL DEFAULT 0,
  logo_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can select testimonials" ON testimonials
  FOR SELECT TO public
  USING (true);

CREATE POLICY "Anyone can insert testimonials" ON testimonials
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update testimonials" ON testimonials
  FOR UPDATE TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete testimonials" ON testimonials
  FOR DELETE TO public
  USING (true);
