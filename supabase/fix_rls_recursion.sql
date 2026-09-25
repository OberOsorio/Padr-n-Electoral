-- ==============================================================================
-- CORRECCIÓN INTEGRAL DE POLÍTICAS RLS (PROFILES Y ELECTORES)
-- Ejecutar en: Dashboard Supabase > SQL Editor > New query > Run
-- ==============================================================================

-- 1. Funciones SECURITY DEFINER optimizadas (evitan recursión y ejecutan a nivel de sistema)
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    r text;
BEGIN
    SELECT role::text INTO r FROM public.profiles WHERE id = auth.uid();
    RETURN coalesce(r, 'coordinador');
END;
$$;

CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    t uuid;
BEGIN
    SELECT tenant_id INTO t FROM public.profiles WHERE id = auth.uid();
    RETURN t;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN coalesce((public.get_auth_role() = 'superadmin'), false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_role() TO anon;
GRANT EXECUTE ON FUNCTION public.get_auth_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_tenant_id() TO anon;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO anon;

-- 2. Limpiar políticas antiguas de profiles que causaban recursión
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and coordinators can view tenant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update tenant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;

-- 3. Crear políticas limpias para profiles
CREATE POLICY "Profiles select policy"
    ON public.profiles FOR SELECT
    USING (
        auth.uid() = id
        OR public.is_superadmin()
        OR (
            tenant_id = public.get_auth_tenant_id()
            AND public.get_auth_role() IN ('admin', 'coordinador')
        )
    );

CREATE POLICY "Profiles update policy"
    ON public.profiles FOR UPDATE
    USING (
        auth.uid() = id
        OR public.is_superadmin()
        OR (
            tenant_id = public.get_auth_tenant_id()
            AND public.get_auth_role() = 'admin'
        )
    );

-- 4. Optimizar políticas para electores usando las funciones helper
DROP POLICY IF EXISTS "Politica de electores segun rol" ON public.electores;
DROP POLICY IF EXISTS "Aislamiento total electores" ON public.electores;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver electores" ON public.electores;
DROP POLICY IF EXISTS "Usuarios autenticados pueden registrar electores" ON public.electores;

CREATE POLICY "Politica de electores segun rol"
    ON public.electores FOR ALL
    USING (
        public.is_superadmin()
        OR (
            tenant_id = public.get_auth_tenant_id()
            AND public.get_auth_role() IN ('admin', 'coordinador')
        )
        OR (
            tenant_id = public.get_auth_tenant_id()
            AND registrado_por = auth.uid()
            AND public.get_auth_role() = 'lider'
        )
    )
    WITH CHECK (
        public.is_superadmin()
        OR (
            tenant_id = public.get_auth_tenant_id()
            AND public.get_auth_role() IN ('admin', 'coordinador')
        )
        OR (
            tenant_id = public.get_auth_tenant_id()
            AND (registrado_por = auth.uid() OR registrado_por IS NULL)
            AND public.get_auth_role() = 'lider'
        )
    );

-- Recargar caché de PostgREST
NOTIFY pgrst, 'reload schema';
