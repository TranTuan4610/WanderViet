
-- Auto-confirm existing users so they can login immediately
UPDATE auth.users SET email_confirmed_at = COALESCE(email_confirmed_at, now()) WHERE email_confirmed_at IS NULL;

-- Function: claim_admin(password) — grants admin role to current authenticated user if password matches
CREATE OR REPLACE FUNCTION public.claim_admin(_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RETURN false;
  END IF;
  IF _password IS DISTINCT FROM '123456789' THEN
    RETURN false;
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_uid, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_admin(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_admin(text) TO authenticated;
