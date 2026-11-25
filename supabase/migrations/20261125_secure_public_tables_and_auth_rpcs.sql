-- The application database is accessed through the authenticated Edge Function.
-- RLS with no client policies denies direct anon/authenticated table access.
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Keep the initial setup RPC available only to the service-role Edge Function.
REVOKE EXECUTE ON FUNCTION public.setup_adaa_users(text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.setup_adaa_users(text, text, text, text, text, text) TO service_role;
REVOKE EXECUTE ON FUNCTION public.verify_adaa_user(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_chair_on_directive() FROM PUBLIC, anon, authenticated;