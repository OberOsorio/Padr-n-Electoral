-- ==============================================================================
-- ELECTORAL COMMAND CENTER - CONFIGURACIÓN INTEGRAL DE BASE DE DATOS (SUPABASE)
-- Ejecutar este script completo en: Dashboard Supabase > SQL Editor > New query > Run
-- ==============================================================================

-- 1. Extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tipo Enum para Roles de Aplicación
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin', 'coordinador', 'lider');
    ELSE
        BEGIN
            ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'coordinador';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
        BEGIN
            ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'lider';
        EXCEPTION WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- ==============================================================================
-- 3. TABLA MAESTRA DE TENANTS / ORGANIZACIONES ELECTORALES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'standard' CHECK (plan IN ('standard', 'pro', 'enterprise')),
    max_electors INTEGER DEFAULT 10000,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);

-- ==============================================================================
-- 4. TABLA DE PERFILES (VINCULADA A AUTH.USERS Y TENANTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role public.app_role NOT NULL DEFAULT 'coordinador',
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);

-- ==============================================================================
-- 5. FUNCIONES DE SEGURIDAD Y CONTEXTO RLS
-- ==============================================================================
-- Funciones de contexto de seguridad (SECURITY DEFINER para prevenir recursión en RLS)
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

-- ==============================================================================
-- 6. TABLA DE ELECTORES (PADRÓN ELECTORAL MULTI-TENANT)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.electores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cedula TEXT NOT NULL,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    telefono TEXT,
    puesto_votacion TEXT NOT NULL,
    mesa INTEGER NOT NULL,
    notas TEXT,
    registrado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices estratégicos
CREATE INDEX IF NOT EXISTS idx_electores_puesto ON public.electores(puesto_votacion);
CREATE INDEX IF NOT EXISTS idx_electores_created_at ON public.electores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_electores_registrado_por ON public.electores(registrado_por);
CREATE INDEX IF NOT EXISTS idx_electores_tenant_id ON public.electores(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_electores_tenant_cedula ON public.electores(tenant_id, cedula);

-- Trigger de asignación automática de autor si registrado_por no se pasa
CREATE OR REPLACE FUNCTION public.set_registrado_por_default()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.registrado_por IS NULL THEN
        NEW.registrado_por := auth.uid();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_registrado_por ON public.electores;
CREATE TRIGGER trg_set_registrado_por
    BEFORE INSERT ON public.electores
    FOR EACH ROW EXECUTE FUNCTION public.set_registrado_por_default();

-- ==============================================================================
-- 7. TABLA DE AUDITORÍA DE EXPORTACIONES (EXPORT_LOGS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.export_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_role TEXT NOT NULL,
    record_count INTEGER NOT NULL DEFAULT 0,
    export_format TEXT NOT NULL CHECK (export_format IN ('xlsx', 'csv')),
    filters_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_export_logs_created_at ON public.export_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_export_logs_user_id ON public.export_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_export_logs_tenant_id ON public.export_logs(tenant_id);

-- ==============================================================================
-- 8. TABLA DE LOGS DE ACCESO Y SEGURIDAD (ACCESS_AUDIT_LOGS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.access_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    tenant_name TEXT,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role public.app_role NOT NULL DEFAULT 'coordinador',
    ip_address TEXT DEFAULT '127.0.0.1',
    user_agent TEXT,
    event_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_access_audit_logs_created_at ON public.access_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_audit_logs_tenant_id ON public.access_audit_logs(tenant_id);

-- ==============================================================================
-- 9. TABLA DE CENSO MAESTRO LOCAL (PRECARGADO PARA AUTOCOMPLETADO <50MS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.censo_maestro (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cedula TEXT UNIQUE NOT NULL,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    puesto_sugerido TEXT,
    mesa_sugerida INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_censo_cedula ON public.censo_maestro (cedula);

-- ==============================================================================
-- 10. POLÍTICAS ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- Tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Superadmin gestiona tenants" ON public.tenants;
CREATE POLICY "Superadmin gestiona tenants"
    ON public.tenants FOR ALL
    USING (public.is_superadmin());

DROP POLICY IF EXISTS "Usuarios leen su propio tenant" ON public.tenants;
CREATE POLICY "Usuarios leen su propio tenant"
    ON public.tenants FOR SELECT
    USING (id = public.get_auth_tenant_id());

-- Profiles
-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and coordinators can view tenant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update tenant profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;

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

-- Electores
ALTER TABLE public.electores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Politica de electores segun rol" ON public.electores;
CREATE POLICY "Politica de electores segun rol"
    ON public.electores FOR ALL
    USING (
        public.is_superadmin()
        OR (
            tenant_id = public.get_auth_tenant_id()
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role IN ('admin', 'coordinador')
            )
        )
        OR (
            tenant_id = public.get_auth_tenant_id()
            AND registrado_por = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'lider'
            )
        )
    )
    WITH CHECK (
        public.is_superadmin()
        OR (
            tenant_id = public.get_auth_tenant_id()
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role IN ('admin', 'coordinador')
            )
        )
        OR (
            tenant_id = public.get_auth_tenant_id()
            AND (registrado_por = auth.uid() OR registrado_por IS NULL)
            AND EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = auth.uid() AND role = 'lider'
            )
        )
    );

-- Export Logs
ALTER TABLE public.export_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Aislamiento total logs exportacion" ON public.export_logs;
CREATE POLICY "Aislamiento total logs exportacion"
    ON public.export_logs FOR ALL
    USING (
        public.is_superadmin() OR tenant_id = public.get_auth_tenant_id()
    )
    WITH CHECK (
        public.is_superadmin() OR tenant_id = public.get_auth_tenant_id()
    );

-- Access Audit Logs
ALTER TABLE public.access_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Aislamiento audit logs" ON public.access_audit_logs;
CREATE POLICY "Aislamiento audit logs"
    ON public.access_audit_logs FOR ALL
    USING (
        public.is_superadmin() OR tenant_id = public.get_auth_tenant_id()
    )
    WITH CHECK (
        public.is_superadmin() OR tenant_id = public.get_auth_tenant_id()
    );

-- Censo Maestro
ALTER TABLE public.censo_maestro ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Consulta de censo para usuarios autenticados" ON public.censo_maestro;
CREATE POLICY "Consulta de censo para usuarios autenticados"
    ON public.censo_maestro FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Consulta de censo para usuarios anon" ON public.censo_maestro;
CREATE POLICY "Consulta de censo para usuarios anon"
    ON public.censo_maestro FOR SELECT
    USING (true);

-- ==============================================================================
-- 11. FUNCIONES RPC PARA OPERACIONES CLAVE
-- ==============================================================================

-- RPC: Búsqueda instantánea en Censo Maestro (<50ms)
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

-- RPC: Verificación anti-colisión de electores por tenant
CREATE OR REPLACE FUNCTION public.check_existing_elector(
    p_cedula TEXT,
    p_tenant_id UUID
)
RETURNS TABLE (
    id UUID,
    cedula TEXT,
    nombres TEXT,
    apellidos TEXT,
    telefono TEXT,
    puesto_votacion TEXT,
    mesa INTEGER,
    created_at TIMESTAMPTZ,
    registrado_por_nombre TEXT,
    registrado_por_rol TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.cedula,
        e.nombres,
        e.apellidos,
        e.telefono,
        e.puesto_votacion,
        e.mesa,
        e.created_at,
        coalesce(p.full_name, 'Personal Autorizado') as registrado_por_nombre,
        coalesce(p.role::text, 'admin') as registrado_por_rol
    FROM public.electores e
    LEFT JOIN public.profiles p ON p.id = e.registrado_por
    WHERE e.cedula = p_cedula 
      AND (e.tenant_id = p_tenant_id OR p_tenant_id IS NULL)
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_existing_elector(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_existing_elector(TEXT, UUID) TO anon;

-- Trigger para provisionar perfil cuando un usuario se registra en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    default_tenant_id UUID;
BEGIN
    -- Obtener o asignar tenant por defecto si no viene en metadata
    SELECT id INTO default_tenant_id FROM public.tenants LIMIT 1;

    INSERT INTO public.profiles (id, full_name, role, tenant_id, is_active)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'admin'::public.app_role),
        COALESCE((NEW.raw_user_meta_data->>'tenant_id')::uuid, default_tenant_id),
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 12. DATOS INICIALES (SEED DATA: TENANT CENTRAL Y CENSO MAESTRO)
-- ==============================================================================

-- Tenant Inicial de Campaña Central
INSERT INTO public.tenants (id, name, slug, plan, max_electors, is_active)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'Campaña Central 2026',
    'campana-central-2026',
    'enterprise',
    50000,
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = EXCLUDED.is_active;

-- Registros de Demostración para el Censo Maestro
INSERT INTO public.censo_maestro (cedula, nombres, apellidos, puesto_sugerido, mesa_sugerida)
VALUES 
    ('1047892341', 'Carlos Eduardo', 'Mendoza Ospina', 'I.E. Santander Central', 4),
    ('1098341902', 'Laura Sofía', 'Herrera Morales', 'Coliseo Municipal de Deportes', 2),
    ('73542189', 'Miguel Ángel', 'Morales Torres', 'Colegio Mayor Departamental', 7),
    ('1143670554', 'Valentina', 'Restrepo Castro', 'I.E. Técnico San Juan Bautista', 1),
    ('1052884112', 'Andrés Felipe', 'Gómez Ortiz', 'Escuela Mixta El Prado', 3),
    ('1085294019', 'Esteban Camilo', 'Torres Valderrama', 'I.E. Santander Central', 4),
    ('528391145', 'María Lucía', 'Pérez Domínguez', 'Coliseo Municipal de Deportes', 2),
    ('1098456432', 'Andrés Felipe', 'Ramírez Gómez', 'I.E. Santander Central', 4),
    ('43987123', 'Carmen Rosa', 'Vargas Silva', 'Colegio Mayor Departamental', 6),
    ('1047892903', 'Jhonatan David', 'Montoya Restrepo', 'I.E. Técnico San Juan Bautista', 1),
    ('1020304050', 'Juliana Patricia', 'Salazar Cardona', 'I.E. Santander Central', 3),
    ('1030405060', 'Diego Fernando', 'Castro Muñoz', 'Coliseo Municipal de Deportes', 5)
ON CONFLICT (cedula) DO UPDATE SET
    nombres = EXCLUDED.nombres,
    apellidos = EXCLUDED.apellidos,
    puesto_sugerido = EXCLUDED.puesto_sugerido,
    mesa_sugerida = EXCLUDED.mesa_sugerida;

-- Habilitar Realtime para electores si existe la publicación
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

-- Recargar la caché de PostgREST
NOTIFY pgrst, 'reload schema';
