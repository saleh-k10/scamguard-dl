CREATE TABLE public.scans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  channel text NOT NULL CHECK (channel IN ('email','sms','other')),
  preview text NOT NULL CHECK (char_length(preview) <= 120),
  score int NOT NULL CHECK (score BETWEEN 0 AND 100),
  level text NOT NULL CHECK (level IN ('low','medium','high')),
  signs jsonb NOT NULL DEFAULT '[]',
  actions jsonb NOT NULL DEFAULT '[]',
  quiz jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX scans_user_created_idx ON public.scans (user_id, created_at DESC);
GRANT SELECT, INSERT, DELETE ON public.scans TO authenticated;
GRANT ALL ON public.scans TO service_role;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own scans" ON public.scans FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users insert own scans" ON public.scans FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own scans" ON public.scans FOR DELETE TO authenticated USING (user_id = auth.uid());