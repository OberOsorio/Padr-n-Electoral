-- 1. Agregar columna edad a electores y censo_maestro
ALTER TABLE public.electores ADD COLUMN IF NOT EXISTS edad integer;
ALTER TABLE public.censo_maestro ADD COLUMN IF NOT EXISTS edad integer;

-- 2. Actualizar registro de Ober Luis Osorio Orozco con su edad real (27 años)
UPDATE public.censo_maestro
SET edad = 27
WHERE cedula = '1007299001';

-- 3. Actualizar función guardar_en_censo_maestro
CREATE OR REPLACE FUNCTION public.guardar_en_censo_maestro(
  p_cedula text,
  p_nombres text,
  p_apellidos text,
  p_puesto text DEFAULT NULL,
  p_mesa int DEFAULT NULL,
  p_edad int DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.censo_maestro (cedula, nombres, apellidos, edad, puesto_sugerido, mesa_sugerida)
  VALUES (
    trim(regexp_replace(p_cedula, '\D', '', 'g')),
    trim(p_nombres),
    trim(p_apellidos),
    p_edad,
    p_puesto,
    p_mesa
  )
  ON CONFLICT (cedula) DO UPDATE
  SET 
    nombres = EXCLUDED.nombres,
    apellidos = EXCLUDED.apellidos,
    edad = COALESCE(EXCLUDED.edad, censo_maestro.edad),
    puesto_sugerido = COALESCE(EXCLUDED.puesto_sugerido, censo_maestro.puesto_sugerido),
    mesa_sugerida = COALESCE(EXCLUDED.mesa_sugerida, censo_maestro.mesa_sugerida);

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.guardar_en_censo_maestro(text, text, text, text, int, int) TO anon, authenticated, service_role;

-- 4. Actualizar función buscar_elector_por_cedula con retorno de edad
DROP FUNCTION IF EXISTS public.buscar_elector_por_cedula(text);
CREATE OR REPLACE FUNCTION public.buscar_elector_por_cedula(p_cedula text)
RETURNS TABLE (
  encontrado boolean,
  nombres text,
  apellidos text,
  edad integer,
  puesto text,
  mesa integer
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_rec record;
  v_clean_cedula text;
BEGIN
  v_clean_cedula := trim(regexp_replace(p_cedula, '\D', '', 'g'));

  IF v_clean_cedula = '' THEN
    RETURN QUERY SELECT false, null::text, null::text, null::integer, null::text, null::integer;
    RETURN;
  END IF;

  SELECT c.nombres, c.apellidos, c.edad, c.puesto_sugerido AS puesto, c.mesa_sugerida AS mesa
  INTO v_rec
  FROM public.censo_maestro c
  WHERE c.cedula = v_clean_cedula
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT true, v_rec.nombres, v_rec.apellidos, v_rec.edad, v_rec.puesto, v_rec.mesa;
  ELSE
    RETURN QUERY SELECT false, null::text, null::text, null::integer, null::text, null::integer;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.buscar_elector_por_cedula(text) TO anon, authenticated, service_role;

-- 5. Actualizar función registrar_elector_directo para admitir p_edad
CREATE OR REPLACE FUNCTION public.registrar_elector_directo(
  p_cedula text,
  p_nombres text,
  p_apellidos text,
  p_telefono text DEFAULT NULL,
  p_puesto text DEFAULT 'I.E. Santander Central',
  p_mesa integer DEFAULT 1,
  p_notas text DEFAULT NULL,
  p_tenant_id text DEFAULT NULL,
  p_registrado_por text DEFAULT NULL,
  p_edad integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_elector_id uuid := gen_random_uuid();
  v_clean_cedula text;
  v_tenant_id uuid;
  v_reg_por uuid;
BEGIN
  v_clean_cedula := trim(regexp_replace(p_cedula, '\D', '', 'g'));

  IF v_clean_cedula = '' OR length(v_clean_cedula) < 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Número de cédula inválido (mínimo 5 dígitos).');
  END IF;

  -- Manejo seguro de UUID de tenant_id
  IF p_tenant_id IS NOT NULL AND p_tenant_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    v_tenant_id := p_tenant_id::uuid;
  ELSE
    SELECT id INTO v_tenant_id FROM public.tenants WHERE is_active = true LIMIT 1;
    IF v_tenant_id IS NULL THEN
      INSERT INTO public.tenants (id, name, slug, plan, max_electors, is_active)
      VALUES (gen_random_uuid(), 'Campaña Central 2026', 'campana-central-2026', 'enterprise', 50000, true)
      RETURNING id INTO v_tenant_id;
    END IF;
  END IF;

  -- Manejo seguro de UUID de registrado_por
  IF p_registrado_por IS NOT NULL AND p_registrado_por ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    v_reg_por := p_registrado_por::uuid;
  ELSE
    v_reg_por := auth.uid();
  END IF;

  -- Validar unicidad de cédula dentro de la misma campaña
  IF EXISTS (SELECT 1 FROM public.electores WHERE cedula = v_clean_cedula AND (tenant_id = v_tenant_id OR tenant_id IS NULL)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Esta cédula ya fue registrada previamente en esta campaña.');
  END IF;

  -- Inserción del registro electoral con edad
  INSERT INTO public.electores (
    id, cedula, nombres, apellidos, edad, telefono, puesto_votacion, mesa, notas, tenant_id, registrado_por
  ) VALUES (
    v_elector_id,
    v_clean_cedula,
    trim(p_nombres),
    trim(p_apellidos),
    p_edad,
    nullif(trim(p_telefono), ''),
    coalesce(nullif(trim(p_puesto), ''), 'I.E. Santander Central'),
    coalesce(p_mesa, 1),
    nullif(trim(p_notas), ''),
    v_tenant_id,
    v_reg_por
  );

  -- Guardar en censo maestro para futuras consultas
  PERFORM public.guardar_en_censo_maestro(v_clean_cedula, p_nombres, p_apellidos, p_puesto, p_mesa, p_edad);

  RETURN jsonb_build_object(
    'success', true,
    'id', v_elector_id,
    'cedula', v_clean_cedula,
    'edad', p_edad,
    'tenant_id', v_tenant_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_elector_directo(text, text, text, text, text, integer, text, text, text, integer) TO anon, authenticated, service_role;
