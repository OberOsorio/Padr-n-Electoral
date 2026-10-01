-- Migración 013: Agregar columna parent_id para árbol jerárquico en profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Asegurar permisos para actualización de perfiles por administradores/superadmins
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Permitir actualizar perfiles a administradores'
  ) THEN
    CREATE POLICY "Permitir actualizar perfiles a administradores"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (
      auth.uid() = id OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('superadmin', 'admin')
      )
    )
    WITH CHECK (
      auth.uid() = id OR EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('superadmin', 'admin')
      )
    );
  END IF;
END $$;
