CREATE OR REPLACE FUNCTION public.guardar_en_censo_maestro(
  p_cedula text,
  p_nombres text,
  p_apellidos text,
  p_puesto text DEFAULT NULL,
  p_mesa int DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.censo_maestro (cedula, nombres, apellidos, puesto_sugerido, mesa_sugerida)
  VALUES (
    trim(regexp_replace(p_cedula, '\D', '', 'g')),
    trim(p_nombres),
    trim(p_apellidos),
    p_puesto,
    p_mesa
  )
  ON CONFLICT (cedula) DO UPDATE
  SET 
    nombres = EXCLUDED.nombres,
    apellidos = EXCLUDED.apellidos,
    puesto_sugerido = COALESCE(EXCLUDED.puesto_sugerido, censo_maestro.puesto_sugerido),
    mesa_sugerida = COALESCE(EXCLUDED.mesa_sugerida, censo_maestro.mesa_sugerida);

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.guardar_en_censo_maestro TO anon, authenticated, service_role;
