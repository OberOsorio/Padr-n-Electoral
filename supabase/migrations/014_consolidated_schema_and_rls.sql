BEGIN;

-- 1. ESTRUCTURA EN PROFILES (Usuarios y Jerarquía)
ALTER TABLE IF EXISTS public.profiles 
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_profiles_tenant_id ON public.profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_parent_id ON public.profiles(parent_id);

-- 2. ESTRUCTURA EN TENANTS (Campañas)
ALTER TABLE IF EXISTS public.tenants
  ADD COLUMN IF NOT EXISTS municipio TEXT DEFAULT 'Cotorra',
  ADD COLUMN IF NOT EXISTS departamento TEXT DEFAULT 'Córdoba',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 3. ESTRUCTURA EN ELECTORES
ALTER TABLE IF EXISTS public.electores
  ADD COLUMN IF NOT EXISTS edad INTEGER,
  ADD COLUMN IF NOT EXISTS puesto_votacion TEXT,
  ADD COLUMN IF NOT EXISTS mesa TEXT,
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_electores_tenant_id ON public.electores(tenant_id);
CREATE INDEX IF NOT EXISTS idx_electores_puesto ON public.electores(puesto_votacion);

-- Reparar electores sin tenant asignado vinculándolos al primer tenant disponible
UPDATE public.electores 
SET tenant_id = (SELECT id FROM public.tenants ORDER BY created_at ASC LIMIT 1)
WHERE tenant_id IS NULL;

-- 4. POLÍTICAS RLS (ROW LEVEL SECURITY)
ALTER TABLE public.electores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Políticas en electores (Lectura y Eliminación)
DROP POLICY IF EXISTS "Lectura de electores autenticados" ON public.electores;
CREATE POLICY "Lectura de electores autenticados" ON public.electores
FOR SELECT TO authenticated
USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  OR tenant_id IS NULL
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin', 'admin'))
);

DROP POLICY IF EXISTS "Permitir eliminar electores" ON public.electores;
CREATE POLICY "Permitir eliminar electores" ON public.electores
FOR DELETE TO authenticated
USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
  OR tenant_id IS NULL
  OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin', 'admin'))
);

-- Políticas en profiles (Lectura y Actualización de Estado)
DROP POLICY IF EXISTS "Lectura general de perfiles autenticados" ON public.profiles;
CREATE POLICY "Lectura general de perfiles autenticados" ON public.profiles
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS "Actualizar estado de usuarios admin" ON public.profiles;
CREATE POLICY "Actualizar estado de usuarios admin" ON public.profiles
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('superadmin', 'admin'))
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('superadmin', 'admin'))
);

-- Políticas en tenants (Edición de campaña)
DROP POLICY IF EXISTS "Permitir actualizar tenants a administradores" ON public.tenants;
CREATE POLICY "Permitir actualizar tenants a administradores" ON public.tenants
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('superadmin', 'admin'))
);

COMMIT;
