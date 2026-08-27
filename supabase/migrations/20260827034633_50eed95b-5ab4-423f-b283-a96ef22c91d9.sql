ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_location TEXT,
  ADD COLUMN IF NOT EXISTS current_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS current_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS search_radius_miles INTEGER NOT NULL DEFAULT 10;

DROP FUNCTION IF EXISTS public.discover_profiles(integer);

CREATE OR REPLACE FUNCTION public.discover_profiles(limit_count integer DEFAULT 30)
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  bio text,
  photos text[],
  vibe_traits text[],
  energy_type text,
  authority text,
  profile text,
  defined_gates integer[],
  distance_miles double precision
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH me AS (
    SELECT COALESCE(p.current_latitude, p.birth_latitude) AS lat,
           COALESCE(p.current_longitude, p.birth_longitude) AS lon
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
  )
  SELECT p.user_id, p.display_name, p.avatar_url, p.bio, p.photos, p.vibe_traits,
         p.energy_type, p.authority, p.profile, p.defined_gates,
         CASE
           WHEN me.lat IS NULL OR me.lon IS NULL
             OR COALESCE(p.current_latitude, p.birth_latitude) IS NULL
             OR COALESCE(p.current_longitude, p.birth_longitude) IS NULL
           THEN NULL
           ELSE round((
             3958.7613 * 2 * asin(least(1, sqrt(
               power(sin(radians(COALESCE(p.current_latitude, p.birth_latitude) - me.lat) / 2), 2)
               + cos(radians(me.lat)) * cos(radians(COALESCE(p.current_latitude, p.birth_latitude)))
                 * power(sin(radians(COALESCE(p.current_longitude, p.birth_longitude) - me.lon) / 2), 2)
             )))
           )::numeric, 1)::double precision
         END AS distance_miles
  FROM public.profiles p
  CROSS JOIN me
  WHERE auth.uid() IS NOT NULL
    AND p.user_id <> auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM public.likes l
      WHERE l.user_id = auth.uid() AND l.target_user_id = p.user_id
    )
  ORDER BY p.created_at DESC
  LIMIT LEAST(COALESCE(limit_count, 30), 100);
$function$;