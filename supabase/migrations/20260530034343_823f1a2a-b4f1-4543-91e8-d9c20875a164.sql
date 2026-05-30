
-- Fix #1: Tighten matches UPDATE policy with WITH CHECK so user_a/user_b cannot be reassigned
DROP POLICY IF EXISTS "Users can update their matches" ON public.matches;
CREATE POLICY "Users can update their matches"
ON public.matches
FOR UPDATE
TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b)
WITH CHECK (
  (auth.uid() = user_a OR auth.uid() = user_b)
  AND user_a = (SELECT m.user_a FROM public.matches m WHERE m.id = matches.id)
  AND user_b = (SELECT m.user_b FROM public.matches m WHERE m.id = matches.id)
  AND status IN ('pending','accepted','declined','expired','archived')
);

-- Fix #2: handle_new_user is a SECURITY DEFINER trigger function — should never be callable directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
