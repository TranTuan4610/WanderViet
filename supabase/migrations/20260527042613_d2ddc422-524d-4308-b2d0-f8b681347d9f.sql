CREATE POLICY "Hotel owners view bookings of their hotels"
ON public.bookings
FOR SELECT
TO authenticated
USING (
  type = 'hotel' AND EXISTS (
    SELECT 1 FROM public.hotels h
    WHERE h.id::text = bookings.ref_id AND h.owner_id = auth.uid()
  )
);