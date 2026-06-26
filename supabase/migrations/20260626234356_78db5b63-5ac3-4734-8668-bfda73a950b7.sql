
-- Restrict profile visibility: only self or matched users can read profile rows.
DROP POLICY IF EXISTS "Users can view other profiles for matching" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can browse completed profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view matched profiles" ON public.profiles;

CREATE POLICY "Users can view matched profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.matches m
    WHERE (m.user_a = auth.uid() AND m.user_b = public.profiles.user_id)
       OR (m.user_b = auth.uid() AND m.user_a = public.profiles.user_id)
  )
);
