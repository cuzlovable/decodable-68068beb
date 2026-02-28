
-- Matches table: stores mutual match pairs
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_a UUID NOT NULL,
  user_b UUID NOT NULL,
  chemistry_score INTEGER DEFAULT 0,
  dominant_theme TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_a, user_b)
);

-- Messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unleash checks (post-interaction feedback)
CREATE TABLE public.unleash_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  authority TEXT NOT NULL,
  response TEXT,
  unleashed BOOLEAN,
  reflection TEXT,
  available_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  answered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS for matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own matches"
  ON public.matches FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Users can insert matches"
  ON public.matches FOR INSERT
  WITH CHECK (auth.uid() = user_a);

CREATE POLICY "Users can update their matches"
  ON public.matches FOR UPDATE
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their matches"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = messages.match_id
      AND (matches.user_a = auth.uid() OR matches.user_b = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their matches"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.matches
      WHERE matches.id = messages.match_id
      AND (matches.user_a = auth.uid() OR matches.user_b = auth.uid())
    )
  );

-- RLS for unleash checks
ALTER TABLE public.unleash_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own unleash checks"
  ON public.unleash_checks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unleash checks"
  ON public.unleash_checks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unleash checks"
  ON public.unleash_checks FOR UPDATE
  USING (auth.uid() = user_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Updated_at trigger for matches
CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
