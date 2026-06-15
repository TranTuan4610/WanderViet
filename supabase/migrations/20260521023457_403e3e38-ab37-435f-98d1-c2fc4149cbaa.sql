ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS owner_id uuid;
CREATE INDEX IF NOT EXISTS idx_hotels_owner_id ON public.hotels(owner_id);