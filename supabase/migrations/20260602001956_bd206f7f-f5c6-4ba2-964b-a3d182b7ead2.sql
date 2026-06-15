GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT SELECT, INSERT ON public.bookings TO anon;
GRANT ALL ON public.bookings TO service_role;