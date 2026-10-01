BEGIN;

-- 1. Tabla de Logs de Seguridad e Inmutabilidad
CREATE TABLE IF NOT EXISTS public.security_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT NOT NULL,
  user_name TEXT,
  user_role TEXT DEFAULT 'lider',
  event_type TEXT NOT NULL, -- 'AUTH_SUCCESS', 'AUTH_FAILED', 'USER_SUSPENDED', 'PASSWORD_RESET', 'REPORT_EXPORTED', 'ELECTOR_BULK_DELETE'
  severity TEXT DEFAULT 'INFO', -- 'INFO', 'WARNING', 'CRITICAL'
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  tenant_name TEXT,
  ip_address TEXT DEFAULT '127.0.0.1',
  user_agent TEXT,
  device_info TEXT,
  action_detail TEXT NOT NULL,
  payload JSONB,
  sha256_hash TEXT -- Hash de integridad inmutable
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.security_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_severity ON public.security_audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_event_type ON public.security_audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_tenant_id ON public.security_audit_logs(tenant_id);

-- 2. Habilitar RLS estricto (Solo administradores y lectura)
ALTER TABLE public.security_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura de logs para superadmin y admin" ON public.security_audit_logs;
CREATE POLICY "Lectura de logs para superadmin y admin"
ON public.security_audit_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('superadmin', 'admin')
  )
);

DROP POLICY IF EXISTS "Permitir insertar logs de auditoria" ON public.security_audit_logs;
CREATE POLICY "Permitir insertar logs de auditoria"
ON public.security_audit_logs
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Denegar cualquier operación de UPDATE o DELETE en logs para preservar inmutabilidad
DROP POLICY IF EXISTS "No eliminar logs de auditoria" ON public.security_audit_logs;
CREATE POLICY "No eliminar logs de auditoria" ON public.security_audit_logs FOR DELETE TO authenticated USING (false);

DROP POLICY IF EXISTS "No modificar logs de auditoria" ON public.security_audit_logs;
CREATE POLICY "No modificar logs de auditoria" ON public.security_audit_logs FOR UPDATE TO authenticated USING (false);

-- 3. Sembrar eventos de prueba iniciales para validar renderizado (idempotente si la tabla está vacía)
INSERT INTO public.security_audit_logs (created_at, user_email, user_name, user_role, event_type, severity, tenant_name, ip_address, device_info, action_detail, sha256_hash)
SELECT * FROM (
  VALUES
    (now() - interval '5 minutes', 'oberosorio1@gmail.com', 'Ober Osorio Orozco', 'superadmin', 'AUTH_SUCCESS', 'INFO', 'TODO POR COTORRA', '186.84.90.12', 'Chrome 128 / macOS ARM64', 'Autenticación exitosa mediante credenciales maestras', encode(sha256('auth_1'::bytea), 'hex')),
    (now() - interval '18 minutes', 'alejodoriall@gmail.com', 'ALEJANDRO DORIA', 'admin', 'USER_SUSPENDED', 'WARNING', 'TODO POR COTORRA', '190.158.42.11', 'Safari 17 / iOS 17.5', 'Suspensión temporal de cuenta para usuario líder', encode(sha256('suspend_1'::bytea), 'hex')),
    (now() - interval '42 minutes', 'desconocido@bot.com', 'IP No Registrada', 'anon', 'AUTH_FAILED', 'CRITICAL', 'TODO POR COTORRA', '45.134.22.88', 'Python-requests/2.31', '3 intentos fallidos de contraseña bloqueados por WAF', encode(sha256('waf_block_1'::bytea), 'hex')),
    (now() - interval '1 hour', 'oberosorio1@gmail.com', 'Ober Osorio Orozco', 'superadmin', 'REPORT_EXPORTED', 'INFO', 'TODO POR COTORRA', '186.84.90.12', 'Chrome 128 / macOS ARM64', 'Descarga de reporte individual del líder en formato .xlsx', encode(sha256('export_1'::bytea), 'hex'))
) AS seed_data(created_at, user_email, user_name, user_role, event_type, severity, tenant_name, ip_address, device_info, action_detail, sha256_hash)
WHERE NOT EXISTS (SELECT 1 FROM public.security_audit_logs LIMIT 1);

COMMIT;
