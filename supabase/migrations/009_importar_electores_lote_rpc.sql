-- Migration 009: Función RPC importar_electores_lote y restricción de unicidad en electores
-- Asegura que la carga masiva (Excel/CSV) inserte de forma atómica, segura, con edad y soporte skip/upsert

-- 1. Asegurar restricción UNIQUE en cedula
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = 'public.electores'::regclass AND conname = 'electores_cedula_key'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conrelid = 'public.electores'::regclass AND conname = 'electores_cedula_unique'
  ) THEN
    ALTER TABLE public.electores ADD CONSTRAINT electores_cedula_unique UNIQUE (cedula);
  END IF;
END $$;

-- 2. Asegurar que columnas edad existan
ALTER TABLE public.electores ADD COLUMN IF NOT EXISTS edad integer;
ALTER TABLE public.censo_maestro ADD COLUMN IF NOT EXISTS edad integer;

-- 3. Crear función RPC importar_electores_lote (Security Definer)
CREATE OR REPLACE FUNCTION public.importar_electores_lote(
  p_electores jsonb,
  p_tenant_id text DEFAULT NULL,
  p_registrado_por text DEFAULT NULL,
  p_collision_mode text DEFAULT 'skip'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
  v_reg_por uuid;
  v_item jsonb;
  v_clean_cedula text;
  v_nombres text;
  v_apellidos text;
  v_edad integer;
  v_telefono text;
  v_puesto text;
  v_mesa integer;
  v_notas text;
  
  v_processed integer := 0;
  v_inserted integer := 0;
  v_updated integer := 0;
  v_skipped integer := 0;
  v_existing_id uuid;
BEGIN
  -- 1. Resolver Tenant ID activo
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

  -- 2. Resolver Registrado Por (seguro contra FK)
  IF p_registrado_por IS NOT NULL AND p_registrado_por ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_registrado_por::uuid) THEN
      v_reg_por := p_registrado_por::uuid;
    ELSE
      v_reg_por := NULL;
    END IF;
  ELSE
    IF auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) THEN
      v_reg_por := auth.uid();
    ELSE
      v_reg_por := NULL;
    END IF;
  END IF;

  -- 3. Iterar cada elemento del payload JSONB
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_electores)
  LOOP
    v_clean_cedula := trim(regexp_replace(coalesce(v_item->>'cedula', ''), '\D', '', 'g'));
    
    IF v_clean_cedula = '' OR length(v_clean_cedula) < 4 THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    v_nombres := trim(coalesce(v_item->>'nombres', ''));
    v_apellidos := trim(coalesce(v_item->>'apellidos', 'Sin Registrar'));
    v_telefono := nullif(trim(coalesce(v_item->>'telefono', '')), '');
    v_puesto := coalesce(nullif(trim(coalesce(v_item->>'puesto_votacion', '')), ''), 'I.E. Santander Central');
    
    BEGIN
      v_mesa := coalesce(nullif(regexp_replace(coalesce(v_item->>'mesa', '1'), '\D', '', 'g'), '')::integer, 1);
    EXCEPTION WHEN OTHERS THEN
      v_mesa := 1;
    END;

    BEGIN
      v_edad := nullif(regexp_replace(coalesce(v_item->>'edad', ''), '\D', '', 'g'), '')::integer;
      IF v_edad < 10 OR v_edad > 120 THEN
        v_edad := NULL;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_edad := NULL;
    END;

    v_notas := nullif(trim(coalesce(v_item->>'notas', '')), '');

    -- Verificar si ya existe en la base de datos
    SELECT id INTO v_existing_id 
    FROM public.electores 
    WHERE cedula = v_clean_cedula
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
      IF p_collision_mode = 'upsert' THEN
        UPDATE public.electores
        SET 
          nombres = CASE WHEN v_nombres <> '' THEN v_nombres ELSE electores.nombres END,
          apellidos = CASE WHEN v_apellidos <> 'Sin Registrar' THEN v_apellidos ELSE electores.apellidos END,
          edad = COALESCE(v_edad, electores.edad),
          telefono = COALESCE(v_telefono, electores.telefono),
          puesto_votacion = v_puesto,
          mesa = v_mesa,
          notas = COALESCE(v_notas, electores.notas),
          tenant_id = v_tenant_id
        WHERE id = v_existing_id;

        v_updated := v_updated + 1;
      ELSE
        -- modo 'skip'
        v_skipped := v_skipped + 1;
      END IF;
    ELSE
      -- Insertar nuevo registro
      INSERT INTO public.electores (
        id, cedula, nombres, apellidos, edad, telefono, puesto_votacion, mesa, notas, tenant_id, registrado_por
      ) VALUES (
        gen_random_uuid(),
        v_clean_cedula,
        v_nombres,
        v_apellidos,
        v_edad,
        v_telefono,
        v_puesto,
        v_mesa,
        v_notas,
        v_tenant_id,
        v_reg_por
      );
      v_inserted := v_inserted + 1;
    END IF;

    -- Sincronizar en censo maestro para autocompletado en consultas futuras
    PERFORM public.guardar_en_censo_maestro(v_clean_cedula, v_nombres, v_apellidos, v_puesto, v_mesa, v_edad);

    v_processed := v_processed + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'processed', v_processed,
    'inserted', v_inserted,
    'updated', v_updated,
    'skipped', v_skipped,
    'tenant_id', v_tenant_id
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.importar_electores_lote(jsonb, text, text, text) TO anon, authenticated, service_role;
