
-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Appointments
CREATE TYPE public.appointment_status AS ENUM ('pending', 'confirmed', 'cancelled');

CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  treatment TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  slot_at TIMESTAMPTZ NOT NULL,
  status appointment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT INSERT ON public.appointments TO anon;
GRANT ALL ON public.appointments TO service_role;

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Anyone (anon + auth) can request an appointment
CREATE POLICY "Anyone can request appointment" ON public.appointments
  FOR INSERT TO anon, authenticated
  WITH CHECK (status = 'pending');

-- Only admin can read full appointments (contains personal info)
CREATE POLICY "Admins read all appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update appointments" ON public.appointments
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete appointments" ON public.appointments
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Public RPC to get busy slots (no personal info)
CREATE OR REPLACE FUNCTION public.get_busy_slots(_from timestamptz, _to timestamptz)
RETURNS TABLE (slot_at timestamptz, duration_minutes integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT slot_at, duration_minutes
  FROM public.appointments
  WHERE status IN ('pending', 'confirmed')
    AND slot_at >= _from
    AND slot_at < _to
$$;

GRANT EXECUTE ON FUNCTION public.get_busy_slots(timestamptz, timestamptz) TO anon, authenticated;

-- Auto-assign first signup as admin
CREATE OR REPLACE FUNCTION public.handle_first_user_as_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_first_user_as_admin();
