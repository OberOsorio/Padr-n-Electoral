-- Migration: 20260928000019_fix_profiles_rls_and_creation.sql
-- Corrección definitiva de RLS, triggers y vinculación de perfiles por tenant_id

-- 1. Asegurar columnas en public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{"can_register_electors": true}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de lectura (SELECT): El admin y superadmin pueden ver todos los perfiles de su misma campaña
DROP POLICY IF EXISTS "Admins pueden ver miembros de su tenant" ON public.profiles;
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Admins pueden ver miembros de su tenant"
ON public.profiles FOR SELECT
USING (
  -- SuperAdmin ve todo
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'superadmin'
  )
  OR
  -- El usuario ve su propio perfil
  auth.uid() = id
  OR
  -- El admin o coordinador de la campaña ve a todos los miembros de su campaña
  tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- 4. Política de inserción (INSERT): Permitir a admins y triggers insertar perfiles en su tenant
DROP POLICY IF EXISTS "Admins can insert profiles in tenant" ON public.profiles;
CREATE POLICY "Admins can insert profiles in tenant"
ON public.profiles FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin')
  )
  OR auth.uid() = id
  OR tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- 5. Política de actualización (UPDATE)
DROP POLICY IF EXISTS "Admins can update profiles in tenant" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Admins can update profiles in tenant"
ON public.profiles FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'superadmin')
  )
  OR auth.uid() = id
  OR tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- 6. Reemplazar trigger antiguo por handle_new_team_user con SECURITY DEFINER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_team ON auth.users;

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
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    updated_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_team
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_team_user();

-- 7. Reparar retroactivamente los perfiles existentes sin tenant_id que tengan metadata en auth.users
UPDATE public.profiles p
SET 
  tenant_id = (u.raw_user_meta_data->>'tenant_id')::uuid,
  permissions = COALESCE(p.permissions, u.raw_user_meta_data->'permissions', '{"can_register_electors": true}'::jsonb),
  email = COALESCE(p.email, u.email),
  full_name = COALESCE(p.full_name, u.raw_user_meta_data->>'full_name')
FROM auth.users u
WHERE p.id = u.id
  AND p.tenant_id IS NULL
  AND u.raw_user_meta_data->>'tenant_id' IS NOT NULL;
