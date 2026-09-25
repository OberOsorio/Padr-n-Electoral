-- Migration: 20260924000005_profiles_admin_policy.sql
-- Políticas para administración integral de equipo y perfiles por administradores

DO $$ 
BEGIN
    -- Permitir a administradores actualizar perfiles de cualquier usuario (is_active, role, full_name)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can update all profiles'
    ) THEN
        CREATE POLICY "Admins can update all profiles" 
        ON public.profiles 
        FOR UPDATE 
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );
    END IF;

    -- Permitir a administradores insertar perfiles directamente
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can insert profiles'
    ) THEN
        CREATE POLICY "Admins can insert profiles" 
        ON public.profiles 
        FOR INSERT 
        TO authenticated
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );
    END IF;

    -- Permitir a administradores eliminar perfiles si es necesario
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can delete profiles'
    ) THEN
        CREATE POLICY "Admins can delete profiles" 
        ON public.profiles 
        FOR DELETE 
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );
    END IF;
END $$;
