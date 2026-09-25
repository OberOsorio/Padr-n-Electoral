-- Migration: 20260924000003_define_electores_schema.sql
-- Fase: Módulo Registrar Elector (anti-colisión, Numpad friendly y asignación automática de usuario)

CREATE TABLE IF NOT EXISTS public.electores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cedula TEXT NOT NULL UNIQUE,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    telefono TEXT,
    puesto_votacion TEXT NOT NULL,
    mesa INTEGER NOT NULL,
    notas TEXT,
    registrado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Si la tabla ya existía con columnas previas, asegurar columnas estándar
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'electores' AND column_name = 'cedula') THEN
        ALTER TABLE public.electores ADD COLUMN cedula TEXT UNIQUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'electores' AND column_name = 'nombres') THEN
        ALTER TABLE public.electores ADD COLUMN nombres TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'electores' AND column_name = 'apellidos') THEN
        ALTER TABLE public.electores ADD COLUMN apellidos TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'electores' AND column_name = 'notas') THEN
        ALTER TABLE public.electores ADD COLUMN notas TEXT;
    END IF;
END $$;

-- Índices estratégicos
CREATE UNIQUE INDEX IF NOT EXISTS idx_electores_cedula_unique ON public.electores(cedula);
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
        SELECT 1 FROM pg_policies WHERE tablename = 'electores' AND policyname = 'Usuarios autenticados pueden registrar electores'
    ) THEN
        CREATE POLICY "Usuarios autenticados pueden registrar electores"
        ON public.electores FOR INSERT
        TO authenticated
        WITH CHECK (
            auth.uid() IS NOT NULL AND (
                registrado_por IS NULL OR registrado_por = auth.uid()
            )
        );
    END IF;
END $$;

-- Función y Trigger para asignar automáticamente registrado_por = auth.uid()
CREATE OR REPLACE FUNCTION public.set_registrado_por_default()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.registrado_por IS NULL THEN
        NEW.registrado_por := auth.uid();
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_registrado_por ON public.electores;

CREATE TRIGGER trg_set_registrado_por
    BEFORE INSERT ON public.electores
    FOR EACH ROW EXECUTE FUNCTION public.set_registrado_por_default();

-- Garantizar Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'electores'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.electores;
    END IF;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;
