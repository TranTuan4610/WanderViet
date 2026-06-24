DROP POLICY IF EXISTS "Admins manage vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Authenticated read vouchers" ON public.vouchers;
CREATE POLICY "Authenticated read active vouchers"
ON public.vouchers
FOR SELECT
TO authenticated
USING (status = 'active' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated admins manage vouchers"
ON public.vouchers
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users view own roles" ON public.user_roles;
CREATE POLICY "Users view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
CREATE POLICY "Authenticated admins manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vouchers TO authenticated;
GRANT ALL ON public.vouchers TO service_role;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;