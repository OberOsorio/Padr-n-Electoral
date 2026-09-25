-- ==============================================================================
-- MIGRACIÓN: 20260925000011_consultar_documento_externo_http.sql
-- Consulta de documento externa ejecutada DIRECTAMENTE desde PostgreSQL vía extensión HTTP
-- ==============================================================================

-- 1. Habilitar extensión http en el esquema extensions (soportada en Supabase)
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;

-- 2. Función RPC para realizar la consulta externa desde el motor de base de datos
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
  -- Configurar timeouts seguros en curl nativo (2.5s connect, 3.5s total) para evitar agotar statement_timeout
  BEGIN
    PERFORM extensions.http_set_curlopt('CURLOPT_CONNECTTIMEOUT', '2');
    PERFORM extensions.http_set_curlopt('CURLOPT_TIMEOUT', '3');
  EXCEPTION WHEN others THEN
    NULL;
  END;

  -- Limpiar documento: solo dígitos
  p_cedula := trim(regexp_replace(p_cedula, '\D', '', 'g'));

  IF length(p_cedula) < 6 THEN
    RETURN QUERY SELECT false, null::text, null::text, null::jsonb;
    RETURN;
  END IF;

  -- Construir el body application/x-www-form-urlencoded
  v_body := 'pNumDoc=' || p_cedula || '&pTipDoc=' || p_tipo_doc;

  -- Ejecutar la petición HTTP directamente desde PostgreSQL con las cabeceras requeridas
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

    -- Verificar código de estado HTTP 200
    IF v_response.status = 200 AND v_response.content IS NOT NULL THEN
      BEGIN
        v_json := v_response.content::jsonb;

        -- Mapear campos devueltos en el JSON (nombres y apellidos)
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
          -- Cachear automáticamente en censo_maestro para futuras consultas instantáneas (<5ms)
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
        -- Si el contenido no fue JSON válido
        RETURN QUERY SELECT false, null::text, null::text, jsonb_build_object('raw_text', v_response.content);
        RETURN;
      END;
    END IF;

    -- Si no retorna datos o código no es 200
    RETURN QUERY SELECT false, null::text, null::text, jsonb_build_object('http_status', v_response.status, 'content', v_response.content);

  EXCEPTION WHEN others THEN
    -- En caso de timeout o bloqueo de red
    RETURN QUERY SELECT false, null::text, null::text, jsonb_build_object('error', SQLERRM);
  END;
END;
$$;

-- Permisos de ejecución
GRANT EXECUTE ON FUNCTION public.consultar_documento_externo(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consultar_documento_externo(text, text) TO anon;

-- Recargar caché de PostgREST
NOTIFY pgrst, 'reload schema';
