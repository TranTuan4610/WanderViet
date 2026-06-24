ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS owner_email text;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS owner_name text;
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS owner_email text;