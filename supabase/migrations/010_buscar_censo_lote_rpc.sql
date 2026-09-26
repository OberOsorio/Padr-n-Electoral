-- Migration 010: Función RPC buscar_censo_lote para autocompletado y enriquecimiento masivo
-- Permite consultar bloques masivos de cédulas indexadas en una sola llamada de red ultrarrápida

CREATE OR REPLACE FUNCTION public.buscar_censo_lote(p_cedulas text[])
RETURNS TABLE (
  cedula text,
  nombres text,
  apellidos text,
  edad integer,
  puesto_sugerido text,
  mesa_sugerida integer
) LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.cedula,
    c.nombres,
    c.apellidos,
    c.edad,
    c.puesto_sugerido,
    c.mesa_sugerida
  FROM public.censo_maestro c
  WHERE c.cedula = ANY(p_cedulas);
END;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_censo_lote(text[]) TO anon, authenticated, service_role;
