-- Add DB-level validation + audit trail for algorithm settings

CREATE TABLE IF NOT EXISTS public.algorithm_settings_audit (
  id bigserial PRIMARY KEY,
  settings_id text NOT NULL REFERENCES public.algorithm_settings(id) ON DELETE CASCADE,
  changed_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  changed_by uuid REFERENCES public.profiles(id),
  changed_fields text[] NOT NULL DEFAULT '{}'::text[],
  old_simple_share_config jsonb,
  new_simple_share_config jsonb,
  old_pricing_config jsonb,
  new_pricing_config jsonb,
  old_niche_rpm_overrides jsonb,
  new_niche_rpm_overrides jsonb,
  old_usage_policy_config jsonb,
  new_usage_policy_config jsonb
);

CREATE INDEX IF NOT EXISTS idx_algorithm_settings_audit_changed_at
  ON public.algorithm_settings_audit (changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_algorithm_settings_audit_settings_id
  ON public.algorithm_settings_audit (settings_id);

ALTER TABLE public.algorithm_settings_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read algorithm settings audit" ON public.algorithm_settings_audit;

CREATE POLICY "Admins can read algorithm settings audit"
ON public.algorithm_settings_audit
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_admin = true
  )
);

CREATE OR REPLACE FUNCTION public.validate_algorithm_settings_payload()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_base_share numeric;
  v_hype_decay_days numeric;
  v_hype_factor numeric;
  v_evergreen_days numeric;
  v_evergreen_factor numeric;

  v_min_one_time_price numeric;
  v_default_base_views numeric;
  v_min_percent_shown numeric;
  v_max_percent_shown numeric;
  v_assumed_percent_shown numeric;
  v_platform_fee_percent numeric;

  v_max_subscription_billing_months integer;

  v_key text;
  v_value jsonb;
  v_niche_rpm numeric;
  v_item text;
BEGIN
  IF jsonb_typeof(NEW.simple_share_config) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'FORBIDDEN: simple_share_config must be a JSON object';
  END IF;

  IF jsonb_typeof(NEW.pricing_config) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'FORBIDDEN: pricing_config must be a JSON object';
  END IF;

  IF jsonb_typeof(NEW.niche_rpm_overrides) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'FORBIDDEN: niche_rpm_overrides must be a JSON object';
  END IF;

  IF jsonb_typeof(NEW.usage_policy_config) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'FORBIDDEN: usage_policy_config must be a JSON object';
  END IF;

  -- SimpleShare config
  IF jsonb_typeof(NEW.simple_share_config->'BASE_SHARE') IS DISTINCT FROM 'number'
     OR jsonb_typeof(NEW.simple_share_config->'HYPE_DECAY_DAYS') IS DISTINCT FROM 'number'
     OR jsonb_typeof(NEW.simple_share_config->'HYPE_FACTOR') IS DISTINCT FROM 'number'
     OR jsonb_typeof(NEW.simple_share_config->'EVERGREEN_DAYS') IS DISTINCT FROM 'number'
     OR jsonb_typeof(NEW.simple_share_config->'EVERGREEN_FACTOR') IS DISTINCT FROM 'number' THEN
    RAISE EXCEPTION 'FORBIDDEN: simple_share_config contains missing/invalid numeric values';
  END IF;

  v_base_share := (NEW.simple_share_config->>'BASE_SHARE')::numeric;
  v_hype_decay_days := (NEW.simple_share_config->>'HYPE_DECAY_DAYS')::numeric;
  v_hype_factor := (NEW.simple_share_config->>'HYPE_FACTOR')::numeric;
  v_evergreen_days := (NEW.simple_share_config->>'EVERGREEN_DAYS')::numeric;
  v_evergreen_factor := (NEW.simple_share_config->>'EVERGREEN_FACTOR')::numeric;

  IF v_base_share < 0 OR v_base_share > 1 THEN
    RAISE EXCEPTION 'FORBIDDEN: BASE_SHARE must be between 0 and 1';
  END IF;

  IF v_hype_decay_days < 0 OR v_hype_decay_days > 3650 THEN
    RAISE EXCEPTION 'FORBIDDEN: HYPE_DECAY_DAYS must be between 0 and 3650';
  END IF;

  IF v_hype_factor < 0 OR v_hype_factor > 10 THEN
    RAISE EXCEPTION 'FORBIDDEN: HYPE_FACTOR must be between 0 and 10';
  END IF;

  IF v_evergreen_days < 0 OR v_evergreen_days > 3650 THEN
    RAISE EXCEPTION 'FORBIDDEN: EVERGREEN_DAYS must be between 0 and 3650';
  END IF;

  IF v_evergreen_factor < 0 OR v_evergreen_factor > 10 THEN
    RAISE EXCEPTION 'FORBIDDEN: EVERGREEN_FACTOR must be between 0 and 10';
  END IF;

  -- Pricing config
  IF jsonb_typeof(NEW.pricing_config->'min_one_time_price') IS DISTINCT FROM 'number'
     OR jsonb_typeof(NEW.pricing_config->'default_base_views') IS DISTINCT FROM 'number'
     OR jsonb_typeof(NEW.pricing_config->'min_percent_shown') IS DISTINCT FROM 'number'
     OR jsonb_typeof(NEW.pricing_config->'max_percent_shown') IS DISTINCT FROM 'number'
     OR jsonb_typeof(NEW.pricing_config->'assumed_percent_shown') IS DISTINCT FROM 'number'
     OR jsonb_typeof(NEW.pricing_config->'platform_fee_percent') IS DISTINCT FROM 'number' THEN
    RAISE EXCEPTION 'FORBIDDEN: pricing_config contains missing/invalid numeric values';
  END IF;

  v_min_one_time_price := (NEW.pricing_config->>'min_one_time_price')::numeric;
  v_default_base_views := (NEW.pricing_config->>'default_base_views')::numeric;
  v_min_percent_shown := (NEW.pricing_config->>'min_percent_shown')::numeric;
  v_max_percent_shown := (NEW.pricing_config->>'max_percent_shown')::numeric;
  v_assumed_percent_shown := (NEW.pricing_config->>'assumed_percent_shown')::numeric;
  v_platform_fee_percent := (NEW.pricing_config->>'platform_fee_percent')::numeric;

  IF v_min_one_time_price < 0 THEN
    RAISE EXCEPTION 'FORBIDDEN: min_one_time_price must be >= 0';
  END IF;

  IF v_default_base_views < 100 THEN
    RAISE EXCEPTION 'FORBIDDEN: default_base_views must be >= 100';
  END IF;

  IF v_min_percent_shown < 0 OR v_min_percent_shown > 1 THEN
    RAISE EXCEPTION 'FORBIDDEN: min_percent_shown must be between 0 and 1';
  END IF;

  IF v_max_percent_shown < v_min_percent_shown OR v_max_percent_shown > 1 THEN
    RAISE EXCEPTION 'FORBIDDEN: max_percent_shown must be between min_percent_shown and 1';
  END IF;

  IF v_assumed_percent_shown < v_min_percent_shown OR v_assumed_percent_shown > v_max_percent_shown THEN
    RAISE EXCEPTION 'FORBIDDEN: assumed_percent_shown must be between min_percent_shown and max_percent_shown';
  END IF;

  IF v_platform_fee_percent < 0 OR v_platform_fee_percent > 0.95 THEN
    RAISE EXCEPTION 'FORBIDDEN: platform_fee_percent must be between 0 and 0.95';
  END IF;

  -- Per-niche overrides
  FOR v_key, v_value IN
    SELECT key, value
    FROM jsonb_each(NEW.niche_rpm_overrides)
  LOOP
    IF jsonb_typeof(v_value) IS DISTINCT FROM 'number' THEN
      RAISE EXCEPTION 'FORBIDDEN: niche_rpm_overrides.% must be numeric', v_key;
    END IF;

    v_niche_rpm := (v_value::text)::numeric;

    IF v_niche_rpm < 0 OR v_niche_rpm > 1000 THEN
      RAISE EXCEPTION 'FORBIDDEN: niche_rpm_overrides.% must be between 0 and 1000', v_key;
    END IF;
  END LOOP;

  -- Usage policy
  IF jsonb_typeof(NEW.usage_policy_config->'allowed_platform_scopes') IS DISTINCT FROM 'array'
     OR jsonb_array_length(NEW.usage_policy_config->'allowed_platform_scopes') = 0 THEN
    RAISE EXCEPTION 'FORBIDDEN: allowed_platform_scopes must be a non-empty array';
  END IF;

  IF jsonb_typeof(NEW.usage_policy_config->'allowed_usage_modes') IS DISTINCT FROM 'array'
     OR jsonb_array_length(NEW.usage_policy_config->'allowed_usage_modes') = 0 THEN
    RAISE EXCEPTION 'FORBIDDEN: allowed_usage_modes must be a non-empty array';
  END IF;

  IF jsonb_typeof(NEW.usage_policy_config->'allowed_license_durations') IS DISTINCT FROM 'array'
     OR jsonb_array_length(NEW.usage_policy_config->'allowed_license_durations') = 0 THEN
    RAISE EXCEPTION 'FORBIDDEN: allowed_license_durations must be a non-empty array';
  END IF;

  IF jsonb_typeof(NEW.usage_policy_config->'allow_exclusive') IS DISTINCT FROM 'boolean' THEN
    RAISE EXCEPTION 'FORBIDDEN: allow_exclusive must be boolean';
  END IF;

  IF jsonb_typeof(NEW.usage_policy_config->'max_subscription_billing_months') IS DISTINCT FROM 'number' THEN
    RAISE EXCEPTION 'FORBIDDEN: max_subscription_billing_months must be numeric';
  END IF;

  v_max_subscription_billing_months := round((NEW.usage_policy_config->>'max_subscription_billing_months')::numeric)::integer;

  IF v_max_subscription_billing_months < 1 OR v_max_subscription_billing_months > 120 THEN
    RAISE EXCEPTION 'FORBIDDEN: max_subscription_billing_months must be between 1 and 120';
  END IF;

  FOR v_item IN
    SELECT jsonb_array_elements_text(NEW.usage_policy_config->'allowed_platform_scopes')
  LOOP
    IF btrim(v_item) = '' THEN
      RAISE EXCEPTION 'FORBIDDEN: allowed_platform_scopes cannot contain empty values';
    END IF;
  END LOOP;

  FOR v_item IN
    SELECT jsonb_array_elements_text(NEW.usage_policy_config->'allowed_usage_modes')
  LOOP
    IF btrim(v_item) = '' THEN
      RAISE EXCEPTION 'FORBIDDEN: allowed_usage_modes cannot contain empty values';
    END IF;
  END LOOP;

  FOR v_item IN
    SELECT jsonb_array_elements_text(NEW.usage_policy_config->'allowed_license_durations')
  LOOP
    IF btrim(v_item) = '' THEN
      RAISE EXCEPTION 'FORBIDDEN: allowed_license_durations cannot contain empty values';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_algorithm_settings_payload ON public.algorithm_settings;

CREATE TRIGGER trg_validate_algorithm_settings_payload
BEFORE INSERT OR UPDATE ON public.algorithm_settings
FOR EACH ROW
EXECUTE FUNCTION public.validate_algorithm_settings_payload();

CREATE OR REPLACE FUNCTION public.audit_algorithm_settings_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_changed_fields text[] := ARRAY[]::text[];
  v_changed_by uuid := coalesce(auth.uid(), NEW.updated_by, OLD.updated_by);
BEGIN
  IF NEW.simple_share_config IS DISTINCT FROM OLD.simple_share_config THEN
    v_changed_fields := array_append(v_changed_fields, 'simple_share_config');
  END IF;

  IF NEW.pricing_config IS DISTINCT FROM OLD.pricing_config THEN
    v_changed_fields := array_append(v_changed_fields, 'pricing_config');
  END IF;

  IF NEW.niche_rpm_overrides IS DISTINCT FROM OLD.niche_rpm_overrides THEN
    v_changed_fields := array_append(v_changed_fields, 'niche_rpm_overrides');
  END IF;

  IF NEW.usage_policy_config IS DISTINCT FROM OLD.usage_policy_config THEN
    v_changed_fields := array_append(v_changed_fields, 'usage_policy_config');
  END IF;

  IF array_length(v_changed_fields, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.algorithm_settings_audit (
    settings_id,
    changed_by,
    changed_fields,
    old_simple_share_config,
    new_simple_share_config,
    old_pricing_config,
    new_pricing_config,
    old_niche_rpm_overrides,
    new_niche_rpm_overrides,
    old_usage_policy_config,
    new_usage_policy_config
  )
  VALUES (
    NEW.id,
    v_changed_by,
    v_changed_fields,
    OLD.simple_share_config,
    NEW.simple_share_config,
    OLD.pricing_config,
    NEW.pricing_config,
    OLD.niche_rpm_overrides,
    NEW.niche_rpm_overrides,
    OLD.usage_policy_config,
    NEW.usage_policy_config
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_algorithm_settings_changes ON public.algorithm_settings;

CREATE TRIGGER trg_audit_algorithm_settings_changes
AFTER UPDATE ON public.algorithm_settings
FOR EACH ROW
EXECUTE FUNCTION public.audit_algorithm_settings_changes();
