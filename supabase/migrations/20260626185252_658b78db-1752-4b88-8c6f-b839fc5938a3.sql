
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS defined_gates integer[] DEFAULT '{}'::integer[],
  ADD COLUMN IF NOT EXISTS defined_centers text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS strategy text,
  ADD COLUMN IF NOT EXISTS not_self_theme text,
  ADD COLUMN IF NOT EXISTS signature text,
  ADD COLUMN IF NOT EXISTS definition text,
  ADD COLUMN IF NOT EXISTS incarnation_cross text,
  ADD COLUMN IF NOT EXISTS chart_raw jsonb;
