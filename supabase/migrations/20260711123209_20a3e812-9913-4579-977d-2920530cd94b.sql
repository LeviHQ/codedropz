
CREATE TABLE public.shares (
  code TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  access_limit INT NOT NULL CHECK (access_limit > 0 AND access_limit <= 9999),
  access_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.shares TO anon, authenticated;
GRANT ALL ON public.shares TO service_role;

ALTER TABLE public.shares ENABLE ROW LEVEL SECURITY;

-- Anyone can create a share (no login required for CodeDropz)
CREATE POLICY "anyone can create shares"
  ON public.shares FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(content) > 0
    AND length(content) <= 200000
    AND expires_at > now()
    AND expires_at <= now() + interval '7 days'
  );

-- Reads only through the security-definer RPC; block direct selects.
-- (No SELECT policy = deny by default.)

-- Retrieval RPC: atomically checks expiry & access limit, increments count,
-- deletes when exhausted or expired.
CREATE OR REPLACE FUNCTION public.retrieve_share(_code TEXT)
RETURNS TABLE (ok BOOLEAN, reason TEXT, content TEXT, remaining INT, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.shares%ROWTYPE;
  _rem INT;
BEGIN
  SELECT * INTO s FROM public.shares WHERE code = upper(trim(_code)) FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'not_found'::TEXT, NULL::TEXT, 0, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  IF s.expires_at <= now() THEN
    DELETE FROM public.shares WHERE code = s.code;
    RETURN QUERY SELECT false, 'expired'::TEXT, NULL::TEXT, 0, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  IF s.access_count >= s.access_limit THEN
    RETURN QUERY SELECT false, 'exhausted'::TEXT, NULL::TEXT, 0, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  UPDATE public.shares
     SET access_count = access_count + 1
   WHERE code = s.code;

  _rem := s.access_limit - (s.access_count + 1);

  IF _rem <= 0 THEN
    DELETE FROM public.shares WHERE code = s.code;
  END IF;

  RETURN QUERY SELECT true, NULL::TEXT, s.content, _rem, s.expires_at;
END;
$$;

REVOKE ALL ON FUNCTION public.retrieve_share(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.retrieve_share(TEXT) TO anon, authenticated;

-- Cleanup function for expired rows (called by pg_cron)
CREATE OR REPLACE FUNCTION public.cleanup_expired_shares()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.shares WHERE expires_at <= now();
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_shares() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_shares() TO service_role;

-- Schedule hourly cleanup of expired shares
CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.schedule(
  'cleanup-expired-shares',
  '0 * * * *',
  $$ SELECT public.cleanup_expired_shares(); $$
);
