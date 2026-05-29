
ALTER TABLE public.antenatal_appointments
  ADD COLUMN IF NOT EXISTS recurrence text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS notify boolean NOT NULL DEFAULT true;

ALTER TABLE public.birth_plans
  ADD COLUMN IF NOT EXISTS share_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS shared_at timestamp with time zone;

-- Allow anonymous public read when share_token matches (used via service_role server fn but also safe with anon)
GRANT SELECT ON public.birth_plans TO anon;

DROP POLICY IF EXISTS "public read shared birth plan" ON public.birth_plans;
CREATE POLICY "public read shared birth plan"
ON public.birth_plans
FOR SELECT
TO anon
USING (share_token IS NOT NULL);
