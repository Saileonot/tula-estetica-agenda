-- Working hours: split into morning + afternoon ranges
ALTER TABLE public.working_hours
  ADD COLUMN morning_open TIME NULL,
  ADD COLUMN morning_close TIME NULL,
  ADD COLUMN afternoon_open TIME NULL,
  ADD COLUMN afternoon_close TIME NULL;

-- Set defaults: Mon-Fri 10-14 & 16:30-19:30, Sat 10-14, Sun closed
UPDATE public.working_hours SET
  morning_open = '10:00', morning_close = '14:00',
  afternoon_open = '16:30', afternoon_close = '19:30',
  is_closed = false
WHERE day_of_week BETWEEN 1 AND 5;

UPDATE public.working_hours SET
  morning_open = '10:00', morning_close = '14:00',
  afternoon_open = NULL, afternoon_close = NULL,
  is_closed = false
WHERE day_of_week = 6;

UPDATE public.working_hours SET
  morning_open = NULL, morning_close = NULL,
  afternoon_open = NULL, afternoon_close = NULL,
  is_closed = true
WHERE day_of_week = 0;

-- Drop legacy single-range columns
ALTER TABLE public.working_hours
  DROP COLUMN open_time,
  DROP COLUMN close_time;

-- Treatments: optional image url for the web card
ALTER TABLE public.treatments
  ADD COLUMN image_url TEXT NULL;

-- Public bucket for treatment images
INSERT INTO storage.buckets (id, name, public)
VALUES ('treatment-images', 'treatment-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view treatment images"
ON storage.objects FOR SELECT
USING (bucket_id = 'treatment-images');

CREATE POLICY "Admins upload treatment images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'treatment-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update treatment images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'treatment-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete treatment images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'treatment-images' AND public.has_role(auth.uid(), 'admin'));
