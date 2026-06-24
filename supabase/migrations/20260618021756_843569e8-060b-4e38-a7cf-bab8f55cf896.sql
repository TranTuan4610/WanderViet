CREATE OR REPLACE FUNCTION public.increment_voucher_used(_voucher_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.vouchers
  SET used = used + 1
  WHERE id = _voucher_id;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.increment_voucher_used(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_voucher_used(uuid) TO service_role;