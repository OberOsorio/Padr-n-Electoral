-- Migration: 20260928000021_fix_profiles_rls_recursion.sql
-- Solución a recursión infinita (42P17) en public.profiles al consultar electores con join a profiles

-- 1. Asegurar funciones SECURITY DEFINER auxiliares para inspeccionar sesión sin disparar RLS recursivo
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
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;
    SELECT tenant_id INTO t FROM public.profiles WHERE id = auth.uid();
    RETURN t;
END;
$$;

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
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;
    SELECT role::text INTO r FROM public.profiles WHERE id = auth.uid();
    RETURN r;
END;
$$;

-- 2. Corregir políticas RLS de profiles reemplazando subconsultas directas por funciones SECURITY DEFINER
DROP POLICY IF EXISTS "Admins pueden ver miembros de su tenant" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Admins pueden ver miembros de su tenant"
ON public.profiles FOR SELECT
USING (
  is_superadmin()
  OR auth.uid() = id
  OR (tenant_id IS NOT NULL AND tenant_id = get_auth_tenant_id())
);

DROP POLICY IF EXISTS "Admins can insert profiles in tenant" ON public.profiles;
CREATE POLICY "Admins can insert profiles in tenant"
ON public.profiles FOR INSERT
WITH CHECK (
  is_superadmin()
  OR get_auth_role() IN ('admin', 'superadmin')
  OR auth.uid() = id
  OR (tenant_id IS NOT NULL AND tenant_id = get_auth_tenant_id())
);

DROP POLICY IF EXISTS "Admins can update profiles in tenant" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Admins can update profiles in tenant"
ON public.profiles FOR UPDATE
USING (
  is_superadmin()
  OR get_auth_role() IN ('admin', 'superadmin')
  OR auth.uid() = id
  OR (tenant_id IS NOT NULL AND tenant_id = get_auth_tenant_id())
);
