-- Profile fields for dating profile
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS vibe_traits text[] NOT NULL DEFAULT '{}';

-- Likes / passes
CREATE TABLE IF NOT EXISTS public.likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  target_user_id uuid NOT NULL,
  action text NOT NULL DEFAULT 'like',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_user_id),
  CONSTRAINT likes_action_check CHECK (action IN ('like','pass')),
  CONSTRAINT likes_not_self CHECK (user_id <> target_user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.likes TO authenticated;
GRANT ALL ON public.likes TO service_role;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own likes" ON public.likes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own likes" ON public.likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own likes" ON public.likes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Mutual like => match
CREATE OR REPLACE FUNCTION public.handle_like_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  a uuid;
  b uuid;
BEGIN
  IF NEW.action <> 'like' THEN
    RETURN NEW;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.likes l
    WHERE l.user_id = NEW.target_user_id
      AND l.target_user_id = NEW.user_id
      AND l.action = 'like'
  ) THEN
    RETURN NEW;
  END IF;

  a := LEAST(NEW.user_id, NEW.target_user_id);
  b := GREATEST(NEW.user_id, NEW.target_user_id);

  IF NOT EXISTS (
    SELECT 1 FROM public.matches m WHERE m.user_a = a AND m.user_b = b
  ) THEN
    INSERT INTO public.matches (user_a, user_b, status) VALUES (a, b, 'accepted');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_like_created ON public.likes;
CREATE TRIGGER on_like_created
AFTER INSERT ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.handle_like_match();

-- Discovery: safe, limited projection of other users' profiles
CREATE OR REPLACE FUNCTION public.discover_profiles(limit_count integer DEFAULT 30)
RETURNS TABLE (
  user_id uuid,
  display_name text,
  avatar_url text,
  bio text,
  photos text[],
  vibe_traits text[],
  energy_type text,
  authority text,
  profile text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.avatar_url, p.bio, p.photos, p.vibe_traits,
         p.energy_type, p.authority, p.profile
  FROM public.profiles p
  WHERE auth.uid() IS NOT NULL
    AND p.user_id <> auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.likes l
      WHERE l.user_id = auth.uid() AND l.target_user_id = p.user_id
    )
  ORDER BY p.created_at DESC
  LIMIT LEAST(COALESCE(limit_count, 30), 100);
$$;

GRANT EXECUTE ON FUNCTION public.discover_profiles(integer) TO authenticated;

-- Realtime for chat
ALTER TABLE public.messages REPLICA IDENTITY FULL;
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Photo storage policies (bucket: profile-photos, private)
DROP POLICY IF EXISTS "Signed-in users can read profile photos" ON storage.objects;
CREATE POLICY "Signed-in users can read profile photos" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Users can upload their own profile photos" ON storage.objects;
CREATE POLICY "Users can upload their own profile photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own profile photos" ON storage.objects;
CREATE POLICY "Users can update their own profile photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own profile photos" ON storage.objects;
CREATE POLICY "Users can delete their own profile photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'profile-photos' AND (storage.foldername(name))[1] = auth.uid()::text);