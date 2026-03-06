-- Prevent fairshare score overflow from legacy clients sending percent values

ALTER TABLE public.reaction_contracts
ALTER COLUMN fairshare_score TYPE numeric(7,4);
