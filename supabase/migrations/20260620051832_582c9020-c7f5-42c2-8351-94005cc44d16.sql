
REVOKE SELECT (owner_email, owner_name) ON public.hotels FROM anon, authenticated, PUBLIC;
REVOKE SELECT (owner_email) ON public.hotel_rooms FROM anon, authenticated, PUBLIC;

GRANT SELECT (id, name, city, description, image, gallery, rating, stars, price, check_in, check_out, requirements, owner_id, created_at, updated_at)
  ON public.hotels TO anon, authenticated;

GRANT SELECT (id, hotel_id, name, beds, available, created_at)
  ON public.hotel_rooms TO anon, authenticated;

GRANT ALL ON public.hotels TO service_role;
GRANT ALL ON public.hotel_rooms TO service_role;

DROP POLICY IF EXISTS "Authenticated can view avatars" ON storage.objects;
CREATE POLICY "Users can view their own avatar" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
