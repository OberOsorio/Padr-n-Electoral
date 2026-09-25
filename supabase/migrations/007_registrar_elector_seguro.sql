-- 1. Asegurar al menos una campaña activa en tenants
DO $$
DECLARE
  v_tid uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE is_active = true) THEN
    INSERT INTO public.tenants (id, name, slug, plan, max_electors, is_active)
    VALUES (gen_random_uuid(), 'Campaña Central 2026', 'campana-central-2026', 'enterprise', 50000, true)
    RETURNING id INTO v_tid;

    -- Asignar tenant al SuperAdmin si no lo tiene
    UPDATE public.profiles
    SET tenant_id = v_tid
    WHERE role = 'superadmin' AND tenant_id IS NULL;
  END IF;
END $$;

-- 2. Habilitar políticas permisivas para electores en desarrollo y producción
DROP POLICY IF EXISTS "Permitir insercion de electores para usuarios autorizados o anon" ON public.electores;
CREATE POLICY "Permitir insercion de electores para usuarios autorizados o anon"
ON public.electores
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir consulta de electores para anon y authenticated" ON public.electores;
CREATE POLICY "Permitir consulta de electores para anon y authenticated"
ON public.electores
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Permitir actualizacion de electores para anon y authenticated" ON public.electores;
CREATE POLICY "Permitir actualizacion de electores para anon y authenticated"
ON public.electores
FOR UPDATE
TO anon, authenticated
USING (true);

-- 3. Función RPC optimizada registrar_elector_directo (Security Definer)
CREATE OR REPLACE FUNCTION public.registrar_elector_directo(
  p_cedula text,
  p_nombres text,
  p_apellidos text,
  p_telefono text DEFAULT NULL,
  p_puesto text DEFAULT 'I.E. Santander Central',
  p_mesa integer DEFAULT 1,
  p_notas text DEFAULT NULL,
  p_tenant_id text DEFAULT NULL,
  p_registrado_por text DEFAULT NULL
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

  -- Inserción del registro electoral
  INSERT INTO public.electores (
    id, cedula, nombres, apellidos, telefono, puesto_votacion, mesa, notas, tenant_id, registrado_por
  ) VALUES (
    v_elector_id,
    v_clean_cedula,
    trim(p_nombres),
    trim(p_apellidos),
    nullif(trim(p_telefono), ''),
    coalesce(nullif(trim(p_puesto), ''), 'I.E. Santander Central'),
    coalesce(p_mesa, 1),
    nullif(trim(p_notas), ''),
    v_tenant_id,
    v_reg_por
  );

  -- Guardar en censo maestro para futuras consultas
  PERFORM public.guardar_en_censo_maestro(v_clean_cedula, p_nombres, p_apellidos, p_puesto, p_mesa);

  RETURN jsonb_build_object(
    'success', true,
    'id', v_elector_id,
    'cedula', v_clean_cedula,
    'tenant_id', v_tenant_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.registrar_elector_directo TO anon, authenticated, service_role;
