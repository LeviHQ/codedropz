
ALTER TABLE public.shares
  ALTER COLUMN content SET DEFAULT '',
  ADD COLUMN IF NOT EXISTS files jsonb NOT NULL DEFAULT '[]'::jsonb;

DROP POLICY IF EXISTS "anyone can create shares" ON public.shares;
CREATE POLICY "anyone can create shares"
  ON public.shares
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (length(content) <= 200000)
    AND (length(content) > 0 OR jsonb_array_length(files) > 0)
    AND (expires_at > now())
    AND (expires_at <= (now() + interval '31 days'))
  );

DROP FUNCTION IF EXISTS public.retrieve_share(text);

CREATE OR REPLACE FUNCTION public.retrieve_share(_code text)
 RETURNS TABLE(ok boolean, reason text, content text, files jsonb, remaining integer, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  s public.shares%ROWTYPE;
  _rem INT;
BEGIN
  SELECT * INTO s FROM public.shares WHERE code = upper(trim(_code)) FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'not_found'::TEXT, NULL::TEXT, NULL::jsonb, 0, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  IF s.expires_at <= now() THEN
    DELETE FROM public.shares WHERE code = s.code;
    RETURN QUERY SELECT false, 'expired'::TEXT, NULL::TEXT, NULL::jsonb, 0, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  IF s.access_count >= s.access_limit THEN
    RETURN QUERY SELECT false, 'exhausted'::TEXT, NULL::TEXT, NULL::jsonb, 0, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  UPDATE public.shares
     SET access_count = access_count + 1
   WHERE code = s.code;

  _rem := s.access_limit - (s.access_count + 1);

  IF _rem <= 0 THEN
    DELETE FROM public.shares WHERE code = s.code;
  END IF;

  RETURN QUERY SELECT true, NULL::TEXT, s.content, s.files, _rem, s.expires_at;
END;
$function$;
