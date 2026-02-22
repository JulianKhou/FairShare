-- Add Stripe Connect ID to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_connect_id text;

-- Add Stripe Session ID and Status to reaction_contracts
ALTER TABLE reaction_contracts
ADD COLUMN IF NOT EXISTS stripe_session_id text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'PENDING';

-- Optional: Add an enum for status if you want strict typing in DB
-- CREATE TYPE reaction_contract_status AS ENUM ('PENDING', 'PAID', 'FAILED');
-- ALTER TABLE reaction_contracts ALTER COLUMN status TYPE reaction_contract_status USING status::reaction_contract_status;
