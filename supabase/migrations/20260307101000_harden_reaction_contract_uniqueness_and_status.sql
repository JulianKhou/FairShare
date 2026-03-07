-- Harden reaction_contracts:
-- 1) enforce one active contract per (licensee, original, reaction_video)
-- 2) enforce a global status transition matrix (also for service_role updates)

-- Temporarily disable update/status triggers while we normalize existing duplicates.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_enforce_reaction_contract_update_rules'
      AND tgrelid = 'public.reaction_contracts'::regclass
      AND NOT tgisinternal
  ) THEN
    EXECUTE 'ALTER TABLE public.reaction_contracts DISABLE TRIGGER trg_enforce_reaction_contract_update_rules';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_enforce_reaction_contract_status_transition_global'
      AND tgrelid = 'public.reaction_contracts'::regclass
      AND NOT tgisinternal
  ) THEN
    EXECUTE 'ALTER TABLE public.reaction_contracts DISABLE TRIGGER trg_enforce_reaction_contract_status_transition_global';
  END IF;
END;
$$;

-- Keep the newest/highest-priority active contract, expire older duplicates.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY licensee_id, original_video_id, coalesce(reaction_video_id, '')
      ORDER BY
        CASE status
          WHEN 'ACTIVE' THEN 1
          WHEN 'PAID' THEN 2
          WHEN 'PENDING' THEN 3
          ELSE 4
        END,
        coalesce(accepted_by_licensor, false) DESC,
        created_at DESC,
        id DESC
    ) AS rn
  FROM public.reaction_contracts
  WHERE coalesce(status, 'PENDING') IN ('PENDING', 'PAID', 'ACTIVE')
)
UPDATE public.reaction_contracts rc
SET status = 'EXPIRED'
FROM ranked r
WHERE rc.id = r.id
  AND r.rn > 1
  AND coalesce(rc.status, 'PENDING') IN ('PENDING', 'PAID', 'ACTIVE');

-- Re-enable disabled triggers.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_enforce_reaction_contract_update_rules'
      AND tgrelid = 'public.reaction_contracts'::regclass
      AND NOT tgisinternal
  ) THEN
    EXECUTE 'ALTER TABLE public.reaction_contracts ENABLE TRIGGER trg_enforce_reaction_contract_update_rules';
  END IF;
END;
$$;

-- Prevent parallel active duplicates at DB level.
CREATE UNIQUE INDEX IF NOT EXISTS idx_reaction_contracts_unique_active_combo
ON public.reaction_contracts (
  licensee_id,
  original_video_id,
  coalesce(reaction_video_id, '')
)
WHERE coalesce(status, 'PENDING') IN ('PENDING', 'PAID', 'ACTIVE');

CREATE OR REPLACE FUNCTION public.enforce_reaction_contract_status_transition_global()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_old text := coalesce(OLD.status, 'PENDING');
  v_new text := coalesce(NEW.status, 'PENDING');
BEGIN
  IF v_old = v_new THEN
    RETURN NEW;
  END IF;

  -- Pending contracts may resolve to accepted/rejected/cancelled/failed outcomes.
  IF v_old = 'PENDING'
     AND v_new = ANY (ARRAY['REJECTED', 'CANCELLED', 'PAID', 'ACTIVE', 'FAILED', 'PAYMENT_FAILED', 'EXPIRED']) THEN
    RETURN NEW;
  END IF;

  -- One-time paid contracts can still be cancelled/failed/expired or moved to active by ops.
  IF v_old = 'PAID'
     AND v_new = ANY (ARRAY['ACTIVE', 'CANCELLED', 'PAYMENT_FAILED', 'EXPIRED']) THEN
    RETURN NEW;
  END IF;

  -- Running subscriptions can fail, be cancelled, or expire.
  IF v_old = 'ACTIVE'
     AND v_new = ANY (ARRAY['PAYMENT_FAILED', 'CANCELLED', 'EXPIRED']) THEN
    RETURN NEW;
  END IF;

  -- Failed states can recover to active or be finalized.
  IF v_old = 'PAYMENT_FAILED'
     AND v_new = ANY (ARRAY['ACTIVE', 'CANCELLED', 'EXPIRED']) THEN
    RETURN NEW;
  END IF;

  IF v_old = 'FAILED'
     AND v_new = ANY (ARRAY['ACTIVE', 'PAYMENT_FAILED', 'CANCELLED', 'EXPIRED']) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'FORBIDDEN: invalid status transition % -> %', v_old, v_new;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_reaction_contract_status_transition_global
ON public.reaction_contracts;

CREATE TRIGGER trg_enforce_reaction_contract_status_transition_global
BEFORE UPDATE OF status ON public.reaction_contracts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_reaction_contract_status_transition_global();
