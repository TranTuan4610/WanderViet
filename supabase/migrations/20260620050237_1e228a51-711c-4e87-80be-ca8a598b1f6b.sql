ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS email_sent_at timestamp with time zone;

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  booking_type text,
  recipient text NOT NULL,
  email_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  response_code integer,
  response_body text,
  request_body jsonb,
  attempt integer NOT NULL DEFAULT 0,
  idempotency_key text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  error_message text
);

GRANT SELECT ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own booking email logs" ON public.email_logs;
CREATE POLICY "Users can view their own booking email logs"
ON public.email_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = email_logs.booking_id
      AND b.user_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_email_logs_booking_id ON public.email_logs (booking_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs (recipient);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_logs_idempotency_key_unique ON public.email_logs (idempotency_key);

DROP TRIGGER IF EXISTS set_email_logs_updated_at ON public.email_logs;
CREATE TRIGGER set_email_logs_updated_at
BEFORE UPDATE ON public.email_logs
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();