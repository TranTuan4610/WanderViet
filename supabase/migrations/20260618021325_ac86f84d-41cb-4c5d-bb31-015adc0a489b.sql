REVOKE EXECUTE ON FUNCTION public.claim_admin(text) FROM PUBLIC, anon, authenticated, service_role;
DROP FUNCTION IF EXISTS public.claim_admin(text);