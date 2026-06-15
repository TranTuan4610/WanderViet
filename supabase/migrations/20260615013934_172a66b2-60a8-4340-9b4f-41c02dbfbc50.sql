
CREATE TABLE public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('tour','hotel')),
  ref_id text NOT NULL,
  ref_title text,
  ref_image text,
  ref_price numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, type, ref_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own favorites" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own favorites" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own favorites" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all favorites" ON public.favorites FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
