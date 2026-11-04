CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Portal: list every share without consuming views. Gated by the SDSM passcode
-- (checked as SHA-256 inside the database so no service-role key is needed by
-- external hosts such as Vercel).
CREATE OR REPLACE FUNCTION public.portal_list_shares(_passcode text)
RETURNS TABLE (
  code text,
  content text,
  created_at timestamptz,
  expires_at timestamptz,
  access_count integer,
  access_limit integer,
  files jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
  SELECT s.code, s.content, s.created_at, s.expires_at, s.access_count, s.access_limit, s.files
  FROM public.shares s
  WHERE _passcode IS NOT NULL
    AND digest(_passcode, 'sha256') = decode('1fa932003151f3a7c27fcb2ff75fe4bd6427e7f9651eb6e91b98315aeba0e5d9', 'hex')
  ORDER BY s.created_at DESC;
$function$;

-- Portal: full detail for one share (text + files). Read-only, passcode-gated.
CREATE OR REPLACE FUNCTION public.portal_get_share(_passcode text, _code text)
RETURNS TABLE (
  code text,
  content text,
  files jsonb,
  created_at timestamptz,
  expires_at timestamptz,
  access_count integer,
  access_limit integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
  SELECT s.code, s.content, s.files, s.created_at, s.expires_at, s.access_count, s.access_limit
  FROM public.shares s
  WHERE _passcode IS NOT NULL
    AND digest(_passcode, 'sha256') = decode('1fa932003151f3a7c27fcb2ff75fe4bd6427e7f9651eb6e91b98315aeba0e5d9', 'hex')
    AND s.code = upper(trim(_code))
  LIMIT 1;
$function$;

GRANT EXECUTE ON FUNCTION public.portal_list_shares(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_get_share(text, text) TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.portal_list_shares(text) FROM public;
REVOKE EXECUTE ON FUNCTION public.portal_get_share(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.portal_list_shares(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.portal_get_share(text, text) TO anon, authenticated;