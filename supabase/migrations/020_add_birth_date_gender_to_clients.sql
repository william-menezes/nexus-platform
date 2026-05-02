-- Add birth_date and gender columns to clients table
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS gender     TEXT CHECK (gender IN ('M', 'F', 'other'));
