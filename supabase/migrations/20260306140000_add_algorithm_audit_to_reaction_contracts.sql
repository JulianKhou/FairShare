-- Add algorithm audit trail columns to reaction_contracts

ALTER TABLE public.reaction_contracts
ADD COLUMN IF NOT EXISTS algorithm_version text NOT NULL DEFAULT 'simpleshare-v1';

ALTER TABLE public.reaction_contracts
ADD COLUMN IF NOT EXISTS algorithm_input_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.reaction_contracts.algorithm_version
IS 'Version string of the pricing/fairshare algorithm used at contract creation.';

COMMENT ON COLUMN public.reaction_contracts.algorithm_input_snapshot
IS 'JSON snapshot of algorithm inputs/settings/outputs used for auditability.';
