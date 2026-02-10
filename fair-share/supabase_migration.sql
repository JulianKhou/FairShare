-- Add missing columns for names
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS channel_title text;

-- Add missing columns for names (from previous step)
ALTER TABLE public.reaction_contracts 
ADD COLUMN IF NOT EXISTS licensor_name text,
ADD COLUMN IF NOT EXISTS licensee_name text;

-- Add RLS Policies
ALTER TABLE public.reaction_contracts ENABLE ROW LEVEL SECURITY;

-- Allow Users to INSERT contracts where they are the Licensee (Reactor)
CREATE POLICY "Enable insert for users based on licensee_id" ON "public"."reaction_contracts"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (((auth.uid()) = licensee_id));

-- Allow Users to VIEW contracts where they are either Licensor or Licensee
CREATE POLICY "Enable read access for involved parties" ON "public"."reaction_contracts"
AS PERMISSIVE FOR SELECT
TO public
USING (auth.uid() = licensor_id OR auth.uid() = licensee_id);

-- Allow Users to UPDATE contracts where they are involved
CREATE POLICY "Enable update for involved parties" ON "public"."reaction_contracts"
AS PERMISSIVE FOR UPDATE
TO public
USING (auth.uid() = licensor_id OR auth.uid() = licensee_id);
