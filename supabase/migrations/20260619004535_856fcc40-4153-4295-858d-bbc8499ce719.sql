ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS customer_email_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS owner_email_sent boolean NOT NULL DEFAULT false;