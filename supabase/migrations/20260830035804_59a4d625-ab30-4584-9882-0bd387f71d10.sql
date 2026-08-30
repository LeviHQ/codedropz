ALTER TABLE public.shares ADD COLUMN IF NOT EXISTS sender_token text;

CREATE OR REPLACE FUNCTION public.delete_share(_code text, _token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _deleted boolean;
BEGIN
  DELETE FROM public.shares
   WHERE code = upper(trim(_code))
     AND sender_token = _token;
  GET DIAGNOSTICS _deleted = ROW_COUNT;
  RETURN _deleted > 0;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.delete_share(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.delete_share(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_share(text, text) TO service_role;