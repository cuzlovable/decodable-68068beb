-- Restrict matches INSERT policy to authenticated role
DROP POLICY IF EXISTS "Users can insert matches" ON public.matches;
CREATE POLICY "Users can insert matches"
ON public.matches
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_a);

-- Tighten profile visibility: only accepted matches expose birth data
DROP POLICY IF EXISTS "Users can view matched profiles" ON public.profiles;
CREATE POLICY "Users can view matched profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.status = 'accepted'
      AND (
        (m.user_a = auth.uid() AND m.user_b = profiles.user_id)
        OR (m.user_b = auth.uid() AND m.user_a = profiles.user_id)
      )
  )
);