-- Migration 025: Función universal en PostgreSQL para cálculo y resolución de edad
-- Soporta años (4 dígitos), fechas ISO (YYYY-MM-DD), o fechas con separador
CREATE OR REPLACE FUNCTION public.calcular_edad_sql(p_fecha_o_anio TEXT)
RETURNS INT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_anio INT;
BEGIN
  IF p_fecha_o_anio IS NULL OR trim(p_fecha_o_anio) = '' THEN
    RETURN NULL;
  END IF;

  -- 1. Si son 4 dígitos exactos (año de nacimiento)
  IF p_fecha_o_anio ~ '^\d{4}$' THEN
    v_anio := p_fecha_o_anio::INT;
    IF v_anio BETWEEN 1900 AND EXTRACT(YEAR FROM now())::INT THEN
      RETURN EXTRACT(YEAR FROM now())::INT - v_anio;
    END IF;
  END IF;

  -- 2. Si es fecha válida convertible a DATE
  BEGIN
    RETURN date_part('year', age(p_fecha_o_anio::DATE))::INT;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calcular_edad_sql(TEXT) TO anon, authenticated, service_role;
