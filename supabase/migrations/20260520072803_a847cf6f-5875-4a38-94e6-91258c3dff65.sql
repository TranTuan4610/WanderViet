ALTER TABLE public.tours
  ADD COLUMN IF NOT EXISTS schedule jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS included jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS excluded jsonb DEFAULT '[]'::jsonb;