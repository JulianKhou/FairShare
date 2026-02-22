-- Migration: Add subscription-related fields to reaction_contracts
-- These fields are needed for metered (usage-based) billing via Stripe.

ALTER TABLE reaction_contracts
ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
ADD COLUMN IF NOT EXISTS stripe_customer_id text,
ADD COLUMN IF NOT EXISTS last_reported_view_count integer DEFAULT 0;

-- Index for efficient lookup of active subscriptions during usage reporting
CREATE INDEX IF NOT EXISTS idx_reaction_contracts_active_subs
ON reaction_contracts (status, pricing_model_type)
WHERE status = 'ACTIVE' AND pricing_model_type IN (2, 3);

COMMENT ON COLUMN reaction_contracts.stripe_subscription_id IS 'Stripe Subscription ID for metered billing contracts';
COMMENT ON COLUMN reaction_contracts.stripe_customer_id IS 'Stripe Customer ID of the licensee';
COMMENT ON COLUMN reaction_contracts.last_reported_view_count IS 'Last reported YouTube view count, used to calculate delta for usage reporting';
