ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS price_eur numeric(10,2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_appointments_phone ON public.appointments (client_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_slot_at ON public.appointments (slot_at);