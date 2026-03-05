-- Harden reaction_contracts updates:
-- 1) Replace broad UPDATE policy with a strict authenticated-party policy
-- 2) Enforce column-level + status-transition rules in a trigger

ALTER TABLE public.reaction_contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable update for involved parties" ON public.reaction_contracts;
DROP POLICY IF EXISTS "Strict update for involved parties" ON public.reaction_contracts;

CREATE POLICY "Strict update for involved parties"
ON public.reaction_contracts
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = licensor_id OR auth.uid() = licensee_id)
WITH CHECK (auth.uid() = licensor_id OR auth.uid() = licensee_id);

CREATE OR REPLACE FUNCTION public.enforce_reaction_contract_update_rules()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text := auth.role();
  v_is_licensor boolean;
  v_is_licensee boolean;
  old_locked jsonb;
  new_locked jsonb;
BEGIN
  -- Internal service-role updates (webhooks, cron, edge functions) stay allowed.
  IF coalesce(v_role, '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'UNAUTHORIZED: authenticated user required';
  END IF;

  v_is_licensor := (v_uid = OLD.licensor_id);
  v_is_licensee := (v_uid = OLD.licensee_id);

  IF NOT (v_is_licensor OR v_is_licensee) THEN
    RAISE EXCEPTION 'FORBIDDEN: caller is not part of this contract';
  END IF;

  -- Licensor may only change acceptance fields + status.
  IF v_is_licensor THEN
    old_locked := to_jsonb(OLD) - ARRAY['accepted_by_licensor', 'licensor_accepted_at', 'status', 'updated_at']::text[];
    new_locked := to_jsonb(NEW) - ARRAY['accepted_by_licensor', 'licensor_accepted_at', 'status', 'updated_at']::text[];

    IF old_locked IS DISTINCT FROM new_locked THEN
      RAISE EXCEPTION 'FORBIDDEN: licensor may only update accepted_by_licensor, licensor_accepted_at and status';
    END IF;

    IF NEW.accepted_by_licensor IS DISTINCT FROM OLD.accepted_by_licensor
       AND NOT (OLD.accepted_by_licensor = false AND NEW.accepted_by_licensor = true) THEN
      RAISE EXCEPTION 'FORBIDDEN: accepted_by_licensor can only change from false to true';
    END IF;

    IF NEW.licensor_accepted_at IS DISTINCT FROM OLD.licensor_accepted_at
       AND coalesce(NEW.accepted_by_licensor, false) IS NOT TRUE THEN
      RAISE EXCEPTION 'FORBIDDEN: licensor_accepted_at requires accepted_by_licensor = true';
    END IF;

  -- Licensee may only change status.
  ELSE
    old_locked := to_jsonb(OLD) - ARRAY['status', 'updated_at']::text[];
    new_locked := to_jsonb(NEW) - ARRAY['status', 'updated_at']::text[];

    IF old_locked IS DISTINCT FROM new_locked THEN
      RAISE EXCEPTION 'FORBIDDEN: licensee may only update status';
    END IF;
  END IF;

  -- Status transition guardrails
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF v_is_licensor AND NOT v_is_licensee THEN
      IF NOT (OLD.status = 'PENDING' AND NEW.status = 'REJECTED') THEN
        RAISE EXCEPTION 'FORBIDDEN: licensor may only set status PENDING -> REJECTED';
      END IF;
    ELSIF v_is_licensee AND NOT v_is_licensor THEN
      IF NOT (OLD.status = 'PENDING' AND NEW.status = 'CANCELLED') THEN
        RAISE EXCEPTION 'FORBIDDEN: licensee may only set status PENDING -> CANCELLED';
      END IF;
    ELSE
      IF NOT (OLD.status = 'PENDING' AND NEW.status IN ('REJECTED', 'CANCELLED')) THEN
        RAISE EXCEPTION 'FORBIDDEN: invalid status transition';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_reaction_contract_update_rules ON public.reaction_contracts;

CREATE TRIGGER trg_enforce_reaction_contract_update_rules
BEFORE UPDATE ON public.reaction_contracts
FOR EACH ROW
EXECUTE FUNCTION public.enforce_reaction_contract_update_rules();
