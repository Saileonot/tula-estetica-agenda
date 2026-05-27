CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.treatments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  duration_minutes INTEGER NOT NULL,
  price_eur NUMERIC(10,2) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.treatments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatments TO authenticated;
GRANT ALL ON public.treatments TO service_role;

ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read treatments" ON public.treatments
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins insert treatments" ON public.treatments
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update treatments" ON public.treatments
  FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete treatments" ON public.treatments
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_treatments_updated_at
  BEFORE UPDATE ON public.treatments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.treatments (id, name, description, duration_minutes, price_eur, sort_order) VALUES
  ('manicura', 'Manicura', 'Cuidado profesional de uñas con esmaltado de larga duración.', 45, 22, 1),
  ('pedicura', 'Pedicura', 'Tratamiento completo de pies, limado, hidratación y esmaltado.', 60, 30, 2),
  ('facial', 'Tratamiento Facial', 'Limpieza profunda, exfoliación y mascarilla revitalizante.', 60, 45, 3),
  ('maderoterapia', 'Masaje con Maderoterapia', 'Masaje moldeante con instrumentos de madera para activar la circulación.', 75, 55, 4),
  ('reductor', 'Tratamiento Reductor', 'Sesión intensiva para reducir contornos y tonificar la piel.', 60, 50, 5),
  ('depilacion', 'Depilación', 'Depilación con cera tibia, suave y precisa.', 30, 18, 6);
