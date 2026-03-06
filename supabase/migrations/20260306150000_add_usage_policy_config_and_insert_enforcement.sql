-- Add usage policy configuration and enforce it on reaction_contracts inserts

ALTER TABLE public.algorithm_settings
ADD COLUMN IF NOT EXISTS usage_policy_config jsonb NOT NULL DEFAULT jsonb_build_object(
  'allowed_platform_scopes', jsonb_build_array('youtube_only'),
  'allowed_usage_modes', jsonb_build_array('reaction_only'),
  'allow_exclusive', false,
  'allowed_license_durations', jsonb_build_array('unlimited'),
  'max_subscription_billing_months', 12
);

UPDATE public.algorithm_settings
SET usage_policy_config = jsonb_build_object(
  'allowed_platform_scopes', coalesce(usage_policy_config->'allowed_platform_scopes', jsonb_build_array('youtube_only')),
  'allowed_usage_modes', coalesce(usage_policy_config->'allowed_usage_modes', jsonb_build_array('reaction_only')),
  'allow_exclusive', coalesce(usage_policy_config->'allow_exclusive', to_jsonb(false)),
  'allowed_license_durations', coalesce(usage_policy_config->'allowed_license_durations', jsonb_build_array('unlimited')),
  'max_subscription_billing_months', coalesce(usage_policy_config->'max_subscription_billing_months', to_jsonb(12))
)
WHERE id = 'default';

CREATE OR REPLACE FUNCTION public.enforce_reaction_contract_insert_usage_policy()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_policy jsonb;
  v_snapshot jsonb := coalesce(NEW.algorithm_input_snapshot, '{}'::jsonb);
  v_selected jsonb := coalesce(v_snapshot->'selected_usage', '{}'::jsonb);
  v_platform text := lower(coalesce(v_selected->>'platform_scope', 'youtube_only'));
  v_usage_mode text := lower(coalesce(v_selected->>'usage_mode', 'reaction_only'));
  v_license_duration text := lower(coalesce(v_selected->>'license_duration', 'unlimited'));
  v_exclusive boolean :=
    CASE
      WHEN jsonb_typeof(v_selected->'exclusivity') = 'boolean' THEN (v_selected->>'exclusivity')::boolean
      ELSE false
    END;
  v_billing_months integer :=
    CASE
      WHEN jsonb_typeof(v_selected->'billing_duration_months') = 'number'
      THEN floor((v_selected->>'billing_duration_months')::numeric)::integer
      ELSE NULL
    END;
  v_allow_exclusive boolean := false;
  v_max_billing integer := 12;
  v_allowed_platforms jsonb;
  v_allowed_modes jsonb;
  v_allowed_durations jsonb;
BEGIN
  IF coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  SELECT usage_policy_config
  INTO v_policy
  FROM public.algorithm_settings
  WHERE id = 'default';

  IF v_policy IS NULL THEN
    v_policy := jsonb_build_object(
      'allowed_platform_scopes', jsonb_build_array('youtube_only'),
      'allowed_usage_modes', jsonb_build_array('reaction_only'),
      'allow_exclusive', false,
      'allowed_license_durations', jsonb_build_array('unlimited'),
      'max_subscription_billing_months', 12
    );
  END IF;

  v_allow_exclusive :=
    CASE lower(coalesce(v_policy->>'allow_exclusive', 'false'))
      WHEN 'true' THEN true
      ELSE false
    END;

  v_max_billing := greatest(
    1,
    coalesce((v_policy->>'max_subscription_billing_months')::integer, 12)
  );

  v_allowed_platforms := coalesce(
    CASE WHEN jsonb_typeof(v_policy->'allowed_platform_scopes') = 'array' THEN v_policy->'allowed_platform_scopes' END,
    '[]'::jsonb
  );

  v_allowed_modes := coalesce(
    CASE WHEN jsonb_typeof(v_policy->'allowed_usage_modes') = 'array' THEN v_policy->'allowed_usage_modes' END,
    '[]'::jsonb
  );

  v_allowed_durations := coalesce(
    CASE WHEN jsonb_typeof(v_policy->'allowed_license_durations') = 'array' THEN v_policy->'allowed_license_durations' END,
    '[]'::jsonb
  );

  IF NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(v_allowed_platforms) AS p(value)
    WHERE lower(trim(p.value)) = v_platform
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN: platform_scope % is not allowed', v_platform;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(v_allowed_modes) AS m(value)
    WHERE lower(trim(m.value)) = v_usage_mode
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN: usage_mode % is not allowed', v_usage_mode;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(v_allowed_durations) AS d(value)
    WHERE lower(trim(d.value)) = v_license_duration
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN: license_duration % is not allowed', v_license_duration;
  END IF;

  IF v_exclusive AND NOT v_allow_exclusive THEN
    RAISE EXCEPTION 'FORBIDDEN: exclusive licenses are not allowed';
  END IF;

  IF NEW.pricing_model_type = 1 THEN
    IF v_billing_months IS NOT NULL THEN
      RAISE EXCEPTION 'FORBIDDEN: one-time model cannot include billing_duration_months';
    END IF;
  ELSE
    IF v_billing_months IS NULL THEN
      v_billing_months := v_max_billing;
    END IF;

    IF v_billing_months < 1 OR v_billing_months > v_max_billing THEN
      RAISE EXCEPTION 'FORBIDDEN: billing_duration_months must be between 1 and %', v_max_billing;
    END IF;
  END IF;

  NEW.algorithm_version := coalesce(NEW.algorithm_version, 'simpleshare-v1@default');

  NEW.algorithm_input_snapshot := jsonb_set(
    coalesce(NEW.algorithm_input_snapshot, '{}'::jsonb),
    '{selected_usage}',
    jsonb_build_object(
      'platform_scope', v_platform,
      'usage_mode', v_usage_mode,
      'exclusivity', v_exclusive,
      'license_duration', v_license_duration,
      'billing_duration_months', CASE WHEN NEW.pricing_model_type = 1 THEN NULL ELSE v_billing_months END
    ),
    true
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_reaction_contract_insert_usage_policy ON public.reaction_contracts;

CREATE TRIGGER trg_enforce_reaction_contract_insert_usage_policy
BEFORE INSERT ON public.reaction_contracts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_reaction_contract_insert_usage_policy();
