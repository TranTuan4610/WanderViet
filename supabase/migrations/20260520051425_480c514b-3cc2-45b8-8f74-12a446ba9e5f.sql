
-- Create flights table
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

ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read flights" ON public.flights FOR SELECT USING (true);
CREATE POLICY "Admins manage flights" ON public.flights FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_flights_updated_at ON public.flights;
CREATE TRIGGER trg_flights_updated_at BEFORE UPDATE ON public.flights
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_hotels_updated_at ON public.hotels;
CREATE TRIGGER trg_hotels_updated_at BEFORE UPDATE ON public.hotels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_tours_updated_at ON public.tours;
CREATE TRIGGER trg_tours_updated_at BEFORE UPDATE ON public.tours
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
