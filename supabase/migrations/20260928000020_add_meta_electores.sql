-- Migration: 20260928000020_add_meta_electores.sql
-- Sistema de Meta de Electores / Cuota Operativa para colaboradores

-- 1. Agregar columna meta_electores a public.profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS meta_electores integer NOT NULL DEFAULT 100 CHECK (meta_electores >= 0);

-- 2. Para cuentas de admin y superadmin, la meta se puede establecer en 0 (sin meta individual)
UPDATE public.profiles
SET meta_electores = 0
WHERE role = 'admin' OR role = 'superadmin';

-- 3. Actualizar trigger handle_new_team_user para persistir meta_electores desde metadata
CREATE OR REPLACE FUNCTION public.handle_new_team_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    tenant_id,
    permissions,
    meta_electores,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nuevo Colaborador'),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'lider'::public.app_role),
    (NEW.raw_user_meta_data->>'tenant_id')::uuid,
    COALESCE(NEW.raw_user_meta_data->'permissions', '{"can_register_electors": true}'::jsonb),
    COALESCE((NEW.raw_user_meta_data->>'meta_electores')::integer, 100),
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    tenant_id = COALESCE(EXCLUDED.tenant_id, public.profiles.tenant_id),
    role = COALESCE(EXCLUDED.role, public.profiles.role),
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    permissions = COALESCE(EXCLUDED.permissions, public.profiles.permissions),
    meta_electores = COALESCE(EXCLUDED.meta_electores, public.profiles.meta_electores),
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    updated_at = now();

  RETURN NEW;
END;
$$;
