-- Ensure every admin CRUD module writes to tables that user-facing pages can read.
-- This migration is idempotent and safe to run after older WanderViet/Wanderlust schemas.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Tours ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  destination text NOT NULL,
  days int NOT NULL DEFAULT 1,
  nights int NOT NULL DEFAULT 0,
  price bigint NOT NULL DEFAULT 0,
  image text,
  rating numeric DEFAULT 4.5,
  seats_left int DEFAULT 20,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS old_price bigint;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS type text DEFAULT 'Biển';
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS stars int DEFAULT 4;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS schedule jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS included jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS excluded jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.tours ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
UPDATE public.tours SET schedule = '[]'::jsonb WHERE schedule IS NULL;
UPDATE public.tours SET included = '[]'::jsonb WHERE included IS NULL;
UPDATE public.tours SET excluded = '[]'::jsonb WHERE excluded IS NULL;
UPDATE public.tours SET gallery = '[]'::jsonb WHERE gallery IS NULL;

-- Hotels --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hotels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  city text NOT NULL,
  stars int NOT NULL DEFAULT 3,
  price bigint NOT NULL DEFAULT 0,
  image text,
  rating numeric DEFAULT 4.5,
  check_in text DEFAULT '14:00',
  check_out text DEFAULT '12:00',
  description text,
  requirements text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS room_description text;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS amenities jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS base_people int NOT NULL DEFAULT 2;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS extra_fee_rate numeric NOT NULL DEFAULT 0.25;
ALTER TABLE public.hotels ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
UPDATE public.hotels SET address = COALESCE(address, city) WHERE address IS NULL;
UPDATE public.hotels SET amenities = '[]'::jsonb WHERE amenities IS NULL;
UPDATE public.hotels SET gallery = '[]'::jsonb WHERE gallery IS NULL;

CREATE TABLE IF NOT EXISTS public.hotel_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  name text NOT NULL,
  beds int NOT NULL DEFAULT 1,
  base_people int NOT NULL DEFAULT 2,
  max_people int NOT NULL DEFAULT 4,
  base_price bigint NOT NULL DEFAULT 0,
  vip boolean NOT NULL DEFAULT false,
  description text,
  image text,
  available int DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS room_type text NOT NULL DEFAULT 'standard';
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS bed_type text;
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS capacity int;
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS amenities jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS owner_email text;
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS price_multiplier numeric NOT NULL DEFAULT 1;
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.hotel_rooms ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
UPDATE public.hotel_rooms SET capacity = COALESCE(capacity, max_people, base_people, 2);
UPDATE public.hotel_rooms SET room_type = CASE WHEN vip THEN 'vip' ELSE COALESCE(NULLIF(room_type, ''), 'standard') END;
UPDATE public.hotel_rooms SET amenities = '[]'::jsonb WHERE amenities IS NULL;

-- Flights -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airline text NOT NULL,
  from_code text NOT NULL,
  to_code text NOT NULL,
  depart text NOT NULL,
  arrive text NOT NULL,
  duration text,
  price bigint NOT NULL DEFAULT 0,
  baggage text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.flights ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Promotions / vouchers -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percent',
  discount_value bigint NOT NULL DEFAULT 0,
  usage_limit int DEFAULT 100,
  used int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS starts_at timestamptz;
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
UPDATE public.vouchers SET discount_type = 'fixed' WHERE discount_type = 'amount';
UPDATE public.vouchers SET status = 'active' WHERE status IS NULL OR status = '';

-- Content -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'blog',
  title text NOT NULL,
  body text,
  image text,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS subtitle text;
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS href text;
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Bookings ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type text NOT NULL,
  ref_id text NOT NULL,
  ref_title text,
  room_id uuid REFERENCES public.hotel_rooms(id) ON DELETE SET NULL,
  total bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  payment_method text DEFAULT 'qr',
  customer_info jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS paid_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room_id uuid REFERENCES public.hotel_rooms(id) ON DELETE SET NULL;

-- Indexes -------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS tours_deleted_at_idx ON public.tours (deleted_at);
CREATE INDEX IF NOT EXISTS hotels_deleted_at_idx ON public.hotels (deleted_at);
CREATE INDEX IF NOT EXISTS hotel_rooms_hotel_id_idx ON public.hotel_rooms (hotel_id);
CREATE INDEX IF NOT EXISTS flights_deleted_at_idx ON public.flights (deleted_at);
CREATE INDEX IF NOT EXISTS vouchers_code_idx ON public.vouchers (upper(code));
CREATE INDEX IF NOT EXISTS bookings_ref_idx ON public.bookings (type, ref_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON public.bookings (status);
CREATE INDEX IF NOT EXISTS bookings_created_at_idx ON public.bookings (created_at DESC);

-- updated_at triggers -------------------------------------------------------
DROP TRIGGER IF EXISTS trg_tours_updated_at ON public.tours;
CREATE TRIGGER trg_tours_updated_at BEFORE UPDATE ON public.tours FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_hotels_updated_at ON public.hotels;
CREATE TRIGGER trg_hotels_updated_at BEFORE UPDATE ON public.hotels FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_hotel_rooms_updated_at ON public.hotel_rooms;
CREATE TRIGGER trg_hotel_rooms_updated_at BEFORE UPDATE ON public.hotel_rooms FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_flights_updated_at ON public.flights;
CREATE TRIGGER trg_flights_updated_at BEFORE UPDATE ON public.flights FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_vouchers_updated_at ON public.vouchers;
CREATE TRIGGER trg_vouchers_updated_at BEFORE UPDATE ON public.vouchers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_content_posts_updated_at ON public.content_posts;
CREATE TRIGGER trg_content_posts_updated_at BEFORE UPDATE ON public.content_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.bookings;
CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS policies --------------------------------------------------------------
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read tours" ON public.tours;
DROP POLICY IF EXISTS "Admins manage tours" ON public.tours;
CREATE POLICY "Public read tours" ON public.tours FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Admins manage tours" ON public.tours FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Public read hotels" ON public.hotels;
DROP POLICY IF EXISTS "Admins manage hotels" ON public.hotels;
CREATE POLICY "Public read hotels" ON public.hotels FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Admins manage hotels" ON public.hotels FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Public read rooms" ON public.hotel_rooms;
DROP POLICY IF EXISTS "Admins manage rooms" ON public.hotel_rooms;
CREATE POLICY "Public read rooms" ON public.hotel_rooms FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Admins manage rooms" ON public.hotel_rooms FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Public read flights" ON public.flights;
DROP POLICY IF EXISTS "Admins manage flights" ON public.flights;
CREATE POLICY "Public read flights" ON public.flights FOR SELECT USING (deleted_at IS NULL);
CREATE POLICY "Admins manage flights" ON public.flights FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Public read vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Admins manage vouchers" ON public.vouchers;
CREATE POLICY "Public read vouchers" ON public.vouchers FOR SELECT USING (status = 'active' AND deleted_at IS NULL);
CREATE POLICY "Admins manage vouchers" ON public.vouchers FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Public read content" ON public.content_posts;
DROP POLICY IF EXISTS "Admins manage content" ON public.content_posts;
CREATE POLICY "Public read content" ON public.content_posts FOR SELECT USING (published = true AND deleted_at IS NULL);
CREATE POLICY "Admins manage content" ON public.content_posts FOR ALL USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Users view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users create own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins update bookings" ON public.bookings;
CREATE POLICY "Users view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admins view all bookings" ON public.bookings FOR SELECT USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins update bookings" ON public.bookings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
