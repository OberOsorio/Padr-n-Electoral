-- Migration: 20260924000002_create_electores.sql
-- Fase 2: Tabla de Electores y Publicación Realtime

CREATE TABLE IF NOT EXISTS public.electores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo TEXT NOT NULL,
    documento_identidad TEXT NOT NULL UNIQUE,
    telefono TEXT,
    puesto_votacion TEXT NOT NULL,
    mesa INTEGER,
    registrado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de consulta frecuente para KPIs y agregaciones
CREATE INDEX IF NOT EXISTS idx_electores_puesto ON public.electores(puesto_votacion);
CREATE INDEX IF NOT EXISTS idx_electores_created_at ON public.electores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_electores_registrado_por ON public.electores(registrado_por);

-- Habilitar Row Level Security
ALTER TABLE public.electores ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'electores' AND policyname = 'Usuarios autenticados pueden ver electores'
    ) THEN
        CREATE POLICY "Usuarios autenticados pueden ver electores"
        ON public.electores FOR SELECT
        TO authenticated
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'electores' AND policyname = 'Usuarios autenticados activos pueden registrar electores'
    ) THEN
        CREATE POLICY "Usuarios autenticados activos pueden registrar electores"
        ON public.electores FOR INSERT
        TO authenticated
        WITH CHECK (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND is_active = true
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

-- Habilitar Supabase Realtime para la tabla electores
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'electores'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.electores;
    END IF;
EXCEPTION
    WHEN undefined_object THEN
        -- Si la publicación aún no existe en el entorno local
        NULL;
END $$;
