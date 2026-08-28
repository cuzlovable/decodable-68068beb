ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS orientation TEXT,
  ADD COLUMN IF NOT EXISTS preferred_genders TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS preferred_age_min INTEGER NOT NULL DEFAULT 18,
  ADD COLUMN IF NOT EXISTS preferred_age_max INTEGER NOT NULL DEFAULT 99;

CREATE OR REPLACE FUNCTION public.profile_age(birth date)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN birth IS NULL THEN NULL
              ELSE date_part('year', age(current_date, birth))::int END;
$$;

DROP FUNCTION IF EXISTS public.discover_profiles(integer);

CREATE FUNCTION public.discover_profiles(limit_count integer DEFAULT 30)
RETURNS TABLE(
  user_id uuid, display_name text, avatar_url text, bio text, photos text[],
  vibe_traits text[], energy_type text, authority text, profile text,
  defined_gates integer[], age integer, distance_miles double precision
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  WITH me AS (
    SELECT COALESCE(p.current_latitude, p.birth_latitude) AS lat,
           COALESCE(p.current_longitude, p.birth_longitude) AS lon,
           COALESCE(p.search_radius_miles, 10) AS my_radius,
           p.gender AS my_gender,
           p.preferred_genders AS my_pref_genders,
           p.preferred_age_min AS my_pref_min,
           p.preferred_age_max AS my_pref_max,
           public.profile_age(p.birth_date) AS my_age
    FROM public.profiles p
    WHERE p.user_id = auth.uid()
  ), scored AS (
    SELECT p.user_id, p.display_name, p.avatar_url, p.bio, p.photos, p.vibe_traits,
           p.energy_type, p.authority, p.profile, p.defined_gates, p.created_at,
           p.gender AS cand_gender,
           p.preferred_genders AS cand_pref_genders,
           p.preferred_age_min AS cand_pref_min,
           p.preferred_age_max AS cand_pref_max,
           public.profile_age(p.birth_date) AS cand_age,
           me.my_radius, me.my_gender, me.my_pref_genders, me.my_pref_min, me.my_pref_max, me.my_age,
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
           END AS dist
    FROM public.profiles p
    CROSS JOIN me
    WHERE auth.uid() IS NOT NULL
      AND p.user_id <> auth.uid()
      AND p.onboarding_completed = true
      AND COALESCE(btrim(p.display_name), '') <> ''
      AND array_length(p.photos, 1) >= 1
      AND p.energy_type IS NOT NULL
      AND p.birth_date IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.likes l
        WHERE l.user_id = auth.uid() AND l.target_user_id = p.user_id
      )
  )
  SELECT s.user_id, s.display_name, s.avatar_url, s.bio, s.photos, s.vibe_traits,
         s.energy_type, s.authority, s.profile, s.defined_gates,
         s.cand_age, s.dist
  FROM scored s
  WHERE s.cand_age >= 18
    AND s.my_age >= 18
    AND (cardinality(s.my_pref_genders) = 0 OR s.cand_gender = ANY (s.my_pref_genders))
    AND s.cand_age BETWEEN s.my_pref_min AND s.my_pref_max
    AND (cardinality(s.cand_pref_genders) = 0 OR s.my_gender IS NULL OR s.my_gender = ANY (s.cand_pref_genders))
    AND s.my_age BETWEEN s.cand_pref_min AND s.cand_pref_max
    AND s.dist IS NOT NULL
    AND s.dist <= s.my_radius
  ORDER BY s.created_at DESC
  LIMIT LEAST(COALESCE(limit_count, 30), 100);
$function$;