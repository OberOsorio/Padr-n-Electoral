-- Migración: Permitir actualización de campañas (tenants) a superadmin y admin
-- Habilitar RLS en tenants si no está activa
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Política para permitir que administradores autorizados actualicen la campaña
DROP POLICY IF EXISTS "Permitir actualizar tenants a administradores" ON public.tenants;

CREATE POLICY "Permitir actualizar tenants a administradores"
ON public.tenants
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('superadmin', 'admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('superadmin', 'admin')
  )
);
