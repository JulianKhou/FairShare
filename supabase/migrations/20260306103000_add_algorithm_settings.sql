-- Add configurable algorithm settings for FairShare and pricing

CREATE TABLE IF NOT EXISTS public.algorithm_settings (
  id text PRIMARY KEY DEFAULT 'default',
  simple_share_config jsonb NOT NULL DEFAULT jsonb_build_object(
    'BASE_SHARE', 0.5,
    'HYPE_DECAY_DAYS', 7,
    'HYPE_FACTOR', 1.5,
    'EVERGREEN_DAYS', 30,
    'EVERGREEN_FACTOR', 0.8
  ),
  pricing_config jsonb NOT NULL DEFAULT jsonb_build_object(
    'min_one_time_price', 0.5,
    'default_base_views', 10000,
    'min_percent_shown', 0.1,
    'max_percent_shown', 1.0,
    'assumed_percent_shown', 0.5
  ),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_by uuid REFERENCES public.profiles(id)
);

INSERT INTO public.algorithm_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.algorithm_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read algorithm settings" ON public.algorithm_settings;
DROP POLICY IF EXISTS "Admins can update algorithm settings" ON public.algorithm_settings;

CREATE POLICY "Allow read algorithm settings"
ON public.algorithm_settings
AS PERMISSIVE
FOR SELECT
TO public
USING (true);

CREATE POLICY "Admins can update algorithm settings"
ON public.algorithm_settings
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_admin = true
  )
);

CREATE OR REPLACE FUNCTION public.touch_algorithm_settings_updated_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());

  IF auth.uid() IS NOT NULL THEN
    NEW.updated_by := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_algorithm_settings_updated_fields ON public.algorithm_settings;

CREATE TRIGGER trg_touch_algorithm_settings_updated_fields
BEFORE UPDATE ON public.algorithm_settings
FOR EACH ROW
EXECUTE FUNCTION public.touch_algorithm_settings_updated_fields();
