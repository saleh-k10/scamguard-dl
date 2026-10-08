CREATE TABLE public.ai_service_state (
  id text PRIMARY KEY,
  paused boolean NOT NULL DEFAULT false,
  status integer,
  reason text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_service_state TO service_role;
REVOKE ALL ON public.ai_service_state FROM anon, authenticated;
ALTER TABLE public.ai_service_state ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.ai_service_state IS 'Server-only AI denial/credit pause state; contains no user messages. Clear pause only after owner restores AI access.';