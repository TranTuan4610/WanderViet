GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT SELECT, INSERT ON public.bookings TO anon;
GRANT ALL ON public.bookings TO service_role;

DROP POLICY IF EXISTS "Admins view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins update bookings" ON public.bookings;

CREATE POLICY "Admins view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));