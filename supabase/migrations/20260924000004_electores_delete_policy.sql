-- Migration: 20260924000004_electores_delete_policy.sql
-- Políticas de eliminación y actualización segura para administradores

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'electores' AND policyname = 'Administradores pueden eliminar electores'
    ) THEN
        CREATE POLICY "Administradores pueden eliminar electores"
        ON public.electores FOR DELETE
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'electores' AND policyname = 'Administradores pueden actualizar electores'
    ) THEN
        CREATE POLICY "Administradores pueden actualizar electores"
        ON public.electores FOR UPDATE
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );
    END IF;
END $$;
