-- ==============================================================================
-- FASE 1: ARQUITECTURA BASE Y CONTROL DE PERFILES EJECUTIVOS
-- ==============================================================================

-- 1. Crear Enum de Roles de Aplicación
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'coordinador');
    END IF;
END $$;

-- 2. Crear Tabla de Perfiles vinculada a auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role public.app_role NOT NULL DEFAULT 'coordinador',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Seguridad (RLS)
-- Los usuarios pueden consultar su propio perfil
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Los usuarios administradores pueden consultar todos los perfiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Los usuarios pueden actualizar su información básica
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- Los administradores pueden gestionar cualquier perfil
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 5. Función y Trigger para auto-aprovisionar perfil al crear usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, is_active)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'coordinador'::public.app_role),
        true
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- FASE 2: PADRÓN ELECTORAL Y TIEMPO REAL
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.electores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo TEXT NOT NULL,
    documento_identidad TEXT NOT NULL UNIQUE,
    telefono TEXT,
    puesto_votacion TEXT NOT NULL,
    mesa INTEGER,
    registrado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_electores_puesto ON public.electores(puesto_votacion);
CREATE INDEX IF NOT EXISTS idx_electores_created_at ON public.electores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_electores_registrado_por ON public.electores(registrado_por);

ALTER TABLE public.electores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados pueden ver electores"
ON public.electores FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Usuarios autenticados activos pueden registrar electores"
ON public.electores FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_active = true
    )
);

CREATE POLICY "Administradores pueden actualizar electores"
ON public.electores FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Publicación Realtime para electores
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'electores'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.electores;
    END IF;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- ==============================================================================
-- FASE 6: AUDITORÍA Y TRAZABILIDAD DE EXPORTACIONES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.export_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_role TEXT NOT NULL,
    record_count INTEGER NOT NULL DEFAULT 0,
    export_format TEXT NOT NULL CHECK (export_format IN ('xlsx', 'csv')),
    filters_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura de historial de exportaciones"
ON public.export_logs FOR SELECT
USING (
    auth.uid() = user_id 
    OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Registro de evento de descarga"
ON public.export_logs FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_export_logs_created_at ON public.export_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_logs_user_id ON public.export_logs(user_id);

-- ==============================================================================
-- FASE 7: ARQUITECTURA MULTI-TENANT B2B (AISLAMIENTO ESTRICTO Y SUPERADMIN)
-- ==============================================================================

-- 1. Tabla Maestra de Campañas / Organizaciones (Tenants)
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'standard' CHECK (plan IN ('standard', 'pro', 'enterprise')),
    max_electors INTEGER DEFAULT 10000,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Modificar App Role para incluir superadmin
DO $$ 
BEGIN
    ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. Vincular tenant_id a tablas principales
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL;

ALTER TABLE public.electores 
    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.export_logs 
    ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 4. Funciones de contexto de seguridad
CREATE OR REPLACE FUNCTION public.get_auth_tenant_id()
RETURNS UUID AS $$
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'superadmin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5. Políticas RLS con Aislamiento Estricto
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin gestiona tenants"
ON public.tenants FOR ALL
USING (public.is_superadmin());

CREATE POLICY "Usuarios leen su propio tenant"
ON public.tenants FOR SELECT
USING (id = public.get_auth_tenant_id());

CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_electores_tenant_id ON public.electores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_tenant_id ON public.export_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);

-- ==============================================================================
-- FASE 8: CENSO MAESTRO LOCAL Y AUTOCOMPLETADO (<50ms)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.censo_maestro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cedula TEXT UNIQUE NOT NULL,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    puesto_sugerido TEXT,
    mesa_sugerida INTEGER,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_censo_cedula ON public.censo_maestro (cedula);

ALTER TABLE public.censo_maestro ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Consulta de censo para usuarios autenticados" ON public.censo_maestro;
CREATE POLICY "Consulta de censo para usuarios autenticados"
ON public.censo_maestro FOR SELECT
USING (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION public.buscar_ciudadano_censo(p_cedula TEXT)
RETURNS TABLE (
    found BOOLEAN,
    nombres TEXT,
    apellidos TEXT,
    puesto_sugerido TEXT,
    mesa_sugerida INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_rec RECORD;
BEGIN
    SELECT c.nombres, c.apellidos, c.puesto_sugerido, c.mesa_sugerida
    INTO v_rec
    FROM public.censo_maestro c
    WHERE c.cedula = trim(p_cedula)
    LIMIT 1;

    IF FOUND THEN
        RETURN QUERY SELECT true, v_rec.nombres, v_rec.apellidos, v_rec.puesto_sugerido, v_rec.mesa_sugerida;
    ELSE
        RETURN QUERY SELECT false, null::text, null::text, null::text, null::integer;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_ciudadano_censo(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_ciudadano_censo(TEXT) TO anon;


