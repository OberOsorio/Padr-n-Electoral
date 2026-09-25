-- ==============================================================================
-- ACTUALIZACIÓN INTEGRAL: EXTENSIÓN HTTP EXTERNA + CORRECCIÓN POLÍTICAS RLS
-- Copiar y pegar en: Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- PARTE 1: HABILITAR EXTENSIÓN HTTP Y CREAR RPC DE CONSULTA EXTERNA
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.consultar_documento_externo(
  p_cedula text,
  p_tipo_doc text default '3'
)
RETURNS TABLE (
  encontrado boolean,
  nombres text,
  apellidos text,
  raw_response jsonb
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_url text := 'https://ventanillasocial.dnp.gov.co/Home/ObtenerDatosRUI';
  v_body text;
  v_response extensions.http_response;
  v_json jsonb;
  v_nombres text;
  v_apellidos text;
BEGIN
  -- Limpiar documento: solo dígitos
  p_cedula := trim(regexp_replace(p_cedula, '\D', '', 'g'));

  IF length(p_cedula) < 6 THEN
    RETURN QUERY SELECT false, null::text, null::text, null::jsonb;
    RETURN;
  END IF;

  -- Construir body x-www-form-urlencoded
  v_body := 'pNumDoc=' || p_cedula || '&pTipDoc=' || p_tipo_doc;

  -- Ejecutar HTTP POST directamente desde el motor de PostgreSQL
  BEGIN
    SELECT * INTO v_response FROM extensions.http((
      'POST',
      v_url,
      ARRAY[
        extensions.http_header('Content-Type', 'application/x-www-form-urlencoded'),
        extensions.http_header('Accept', '*/*'),
        extensions.http_header('Accept-Language', 'es-CO,es-ES;q=0.9,es;q=0.8'),
        extensions.http_header('Origin', 'https://ventanillasocial.dnp.gov.co'),
        extensions.http_header('Referer', 'https://ventanillasocial.dnp.gov.co/'),
        extensions.http_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36')
      ],
      'application/x-www-form-urlencoded',
      v_body
    )::extensions.http_request);

    IF v_response.status = 200 AND v_response.content IS NOT NULL THEN
      BEGIN
        v_json := v_response.content::jsonb;

        v_nombres := trim(concat_ws(' ', 
          v_json->>'primerNombre', 
          v_json->>'segundoNombre',
          v_json->>'nombres'
        ));

        v_apellidos := trim(concat_ws(' ', 
          v_json->>'primerApellido', 
          v_json->>'segundoApellido',
          v_json->>'apellidos'
        ));

        IF coalesce(v_nombres, '') <> '' OR coalesce(v_apellidos, '') <> '' THEN
          -- Auto-cacheo en censo_maestro para consultas futuras ultra-rápidas (<5ms)
          BEGIN
            INSERT INTO public.censo_maestro (cedula, nombres, apellidos)
            VALUES (p_cedula, v_nombres, v_apellidos)
            ON CONFLICT (cedula) DO UPDATE SET
              nombres = EXCLUDED.nombres,
              apellidos = EXCLUDED.apellidos;
          EXCEPTION WHEN others THEN
            NULL;
          END;

          RETURN QUERY SELECT true, v_nombres, v_apellidos, v_json;
          RETURN;
        END IF;
      EXCEPTION WHEN others THEN
        RETURN QUERY SELECT false, null::text, null::text, jsonb_build_object('raw_text', v_response.content);
        RETURN;
      END;
    END IF;

    RETURN QUERY SELECT false, null::text, null::text, jsonb_build_object('http_status', v_response.status);

  EXCEPTION WHEN others THEN
    RETURN QUERY SELECT false, null::text, null::text, jsonb_build_object('error', SQLERRM);
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.consultar_documento_externo(text, text) TO authenticated, anon;

-- ------------------------------------------------------------------------------
-- PARTE 2: FUNCIONES HELPER Y CORRECCIÓN DE RECURSIÓN RLS EN PROFILES
-- ------------------------------------------------------------------------------
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

GRANT EXECUTE ON FUNCTION public.get_auth_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_auth_tenant_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_superadmin() TO authenticated, anon;

-- Limpieza de políticas recursivas
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

-- Optimizar políticas de electores
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

-- 5. Gateway de ejecución administrativa para operaciones DDL futuras
CREATE OR REPLACE FUNCTION public.exec_sql(query text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    EXECUTE query;
    RETURN jsonb_build_object('success', true);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- Recargar caché de PostgREST
NOTIFY pgrst, 'reload schema';

