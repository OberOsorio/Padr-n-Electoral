-- ==============================================================================
-- MIGRACIÓN: 20260925000012_eliminar_tenant_critico_rpc.sql
-- Borrado destructivo hermético de campañas con auditoría inmutable y cascada
-- ==============================================================================

-- 1. Tabla de Auditoría Inmutable (Conserva la traza incluso tras borrar el tenant)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID,
    user_id UUID,
    user_email TEXT,
    security_event TEXT NOT NULL,
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Superadmin gestiona audit_logs" ON public.audit_logs;
CREATE POLICY "Superadmin gestiona audit_logs"
    ON public.audit_logs FOR ALL
    USING (public.is_superadmin());

-- 2. Asegurar llaves foráneas con ON DELETE CASCADE
ALTER TABLE public.electores 
    DROP CONSTRAINT IF EXISTS electores_tenant_id_fkey,
    ADD CONSTRAINT electores_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.export_logs 
    DROP CONSTRAINT IF EXISTS export_logs_tenant_id_fkey,
    ADD CONSTRAINT export_logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS profiles_tenant_id_fkey,
    ADD CONSTRAINT profiles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 3. Función RPC de Borrado Crítico Destructivo
CREATE OR REPLACE FUNCTION public.eliminar_tenant_critico(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_tenant RECORD;
    v_users_deleted INTEGER := 0;
    v_electores_deleted INTEGER := 0;
BEGIN
    -- 1. Verificar permisos: solo superadmin puede ejecutar esta acción destructiva
    IF NOT public.is_superadmin() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Permiso denegado: solo el superadmin puede eliminar campañas.');
    END IF;

    -- 2. Verificar existencia del tenant
    SELECT * INTO v_tenant FROM public.tenants WHERE id = p_tenant_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'La campaña no existe o ya fue eliminada.');
    END IF;

    -- 3. Contabilizar registros a ser destruidos para trazabilidad
    SELECT count(*) INTO v_users_deleted FROM public.profiles WHERE tenant_id = p_tenant_id AND role <> 'superadmin';
    SELECT count(*) INTO v_electores_deleted FROM public.electores WHERE tenant_id = p_tenant_id;

    -- 4. Registrar en audit_logs inmutable (seguridad y auditoría forense)
    INSERT INTO public.audit_logs (tenant_id, user_id, user_email, security_event, raw_data)
    VALUES (
        p_tenant_id,
        auth.uid(),
        COALESCE(auth.jwt()->>'email', 'superadmin'),
        'CAMPANA_ELIMINADA_DEFINITIVAMENTE',
        jsonb_build_object(
            'tenant', row_to_json(v_tenant),
            'usuarios_eliminados', v_users_deleted,
            'electores_eliminados', v_electores_deleted,
            'deleted_at', now()
        )
    );

    -- 5. Registrar en access_audit_logs para la vista de seguridad
    INSERT INTO public.access_audit_logs (
        tenant_id, tenant_name, user_email, user_name, user_role, event_type, description
    )
    VALUES (
        p_tenant_id,
        v_tenant.name,
        COALESCE(auth.jwt()->>'email', 'superadmin'),
        COALESCE(auth.jwt()->>'full_name', 'SuperAdmin'),
        'superadmin',
        'campaign_deleted',
        'Campaña "' || v_tenant.name || '" eliminada definitivamente junto a ' || v_electores_deleted || ' electores y ' || v_users_deleted || ' usuarios.'
    );

    -- 6. Eliminar usuarios de Auth que no sean superadmins y pertenecían a este tenant
    DELETE FROM auth.users
    WHERE id IN (
        SELECT id FROM public.profiles
        WHERE tenant_id = p_tenant_id AND role <> 'superadmin'
    );

    -- 7. Borrado en cascada de electores, logs y profiles
    DELETE FROM public.electores WHERE tenant_id = p_tenant_id;
    DELETE FROM public.export_logs WHERE tenant_id = p_tenant_id;
    DELETE FROM public.profiles WHERE tenant_id = p_tenant_id AND role <> 'superadmin';

    -- 8. Borrado físico definitivo del Tenant
    DELETE FROM public.tenants WHERE id = p_tenant_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Campaña eliminada definitivamente de forma hermética',
        'tenant_name', v_tenant.name,
        'electores_eliminados', v_electores_deleted,
        'usuarios_eliminados', v_users_deleted
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.eliminar_tenant_critico(UUID) TO authenticated, service_role;

-- Recargar caché de PostgREST
NOTIFY pgrst, 'reload schema';
