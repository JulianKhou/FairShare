-- Extend algorithm_settings with platform fee and per-niche RPM overrides

ALTER TABLE public.algorithm_settings
ADD COLUMN IF NOT EXISTS niche_rpm_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.algorithm_settings
SET pricing_config = coalesce(pricing_config, '{}'::jsonb) || jsonb_build_object(
  'platform_fee_percent', 0.1
)
WHERE NOT (coalesce(pricing_config, '{}'::jsonb) ? 'platform_fee_percent');
