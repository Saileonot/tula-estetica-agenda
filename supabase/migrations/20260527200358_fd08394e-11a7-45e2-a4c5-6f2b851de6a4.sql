
-- Horario semanal (una fila por día de la semana, 0=domingo .. 6=sábado)
CREATE TABLE public.working_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week SMALLINT NOT NULL UNIQUE CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME NOT NULL DEFAULT '10:00',
  close_time TIME NOT NULL DEFAULT '19:00',
  is_closed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.working_hours TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.working_hours TO authenticated;
GRANT ALL ON public.working_hours TO service_role;

ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read working hours"
ON public.working_hours FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage working hours - insert"
ON public.working_hours FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage working hours - update"
ON public.working_hours FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage working hours - delete"
ON public.working_hours FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Seed: L-V 10-19, Sábado 10-14, Domingo cerrado
INSERT INTO public.working_hours (day_of_week, open_time, close_time, is_closed) VALUES
  (0, '10:00', '19:00', true),
  (1, '10:00', '19:00', false),
  (2, '10:00', '19:00', false),
  (3, '10:00', '19:00', false),
  (4, '10:00', '19:00', false),
  (5, '10:00', '19:00', false),
  (6, '10:00', '14:00', false);

-- Bloqueos puntuales (ausencias, vacaciones, comidas, etc.)
CREATE TABLE public.time_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE INDEX idx_time_blocks_range ON public.time_blocks (starts_at, ends_at);

GRANT SELECT ON public.time_blocks TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.time_blocks TO authenticated;
GRANT ALL ON public.time_blocks TO service_role;

ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read time blocks"
ON public.time_blocks FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage time blocks - insert"
ON public.time_blocks FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage time blocks - update"
ON public.time_blocks FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage time blocks - delete"
ON public.time_blocks FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Actualizar get_busy_slots para incluir también los bloqueos
CREATE OR REPLACE FUNCTION public.get_busy_slots(_from TIMESTAMPTZ, _to TIMESTAMPTZ)
RETURNS TABLE(slot_at TIMESTAMPTZ, duration_minutes INTEGER)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT slot_at, duration_minutes
  FROM public.appointments
  WHERE status IN ('pending', 'confirmed')
    AND slot_at >= _from
    AND slot_at < _to
  UNION ALL
  SELECT
    GREATEST(starts_at, _from) AS slot_at,
    CEIL(EXTRACT(EPOCH FROM (LEAST(ends_at, _to) - GREATEST(starts_at, _from))) / 60)::INTEGER AS duration_minutes
  FROM public.time_blocks
  WHERE starts_at < _to AND ends_at > _from
$$;
