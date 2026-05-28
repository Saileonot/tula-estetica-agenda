DROP POLICY IF EXISTS "Anyone can request appointment" ON public.appointments;
CREATE POLICY "Anyone can book appointment"
ON public.appointments
FOR INSERT
TO anon, authenticated
WITH CHECK (status IN ('pending'::appointment_status, 'confirmed'::appointment_status));