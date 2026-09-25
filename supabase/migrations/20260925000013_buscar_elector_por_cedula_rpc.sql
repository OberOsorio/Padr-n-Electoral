-- ==============================================================================
-- Migración: Función RPC buscar_elector_por_cedula para autocompletado en tiempo real
-- ==============================================================================

-- 1. Indexación B-Tree de alta velocidad sobre cedula en censo_maestro
CREATE INDEX IF NOT EXISTS idx_censo_maestro_cedula ON public.censo_maestro(cedula);

-- 2. Función optimizada para búsqueda por documento en el censo interno
CREATE OR REPLACE FUNCTION public.buscar_elector_por_cedula(p_cedula text)
RETURNS TABLE (
  encontrado boolean,
  nombres text,
  apellidos text,
  puesto text,
  mesa integer
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_rec record;
  v_clean_cedula text;
BEGIN
  v_clean_cedula := trim(regexp_replace(p_cedula, '\D', '', 'g'));

  IF v_clean_cedula = '' THEN
    RETURN QUERY SELECT false, null::text, null::text, null::text, null::integer;
    RETURN;
  END IF;

  -- Buscar en la tabla de censo maestro / base histórica
  SELECT c.nombres, c.apellidos, c.puesto_sugerido AS puesto, c.mesa_sugerida AS mesa
  INTO v_rec
  FROM public.censo_maestro c
  WHERE c.cedula = v_clean_cedula
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT true, v_rec.nombres, v_rec.apellidos, v_rec.puesto, v_rec.mesa;
  ELSE
    RETURN QUERY SELECT false, null::text, null::text, null::text, null::integer;
  END IF;
END;
$$;

-- 3. Permisos de ejecución
GRANT EXECUTE ON FUNCTION public.buscar_elector_por_cedula(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_elector_por_cedula(text) TO anon;

-- 4. Alias de compatibilidad hacia buscar_ciudadano_censo
CREATE OR REPLACE FUNCTION public.buscar_ciudadano_censo(p_cedula text)
RETURNS TABLE (
  found boolean,
  nombres text,
  apellidos text,
  puesto_sugerido text,
  mesa_sugerida integer
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_rec record;
BEGIN
  SELECT b.encontrado, b.nombres, b.apellidos, b.puesto, b.mesa
  INTO v_rec
  FROM public.buscar_elector_por_cedula(p_cedula) b;

  RETURN QUERY SELECT v_rec.encontrado, v_rec.nombres, v_rec.apellidos, v_rec.puesto, v_rec.mesa;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_ciudadano_censo(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.buscar_ciudadano_censo(text) TO anon;
