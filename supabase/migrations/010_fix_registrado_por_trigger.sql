-- Migration 010: Protección total contra violación de llave foránea en electores_registrado_por_fkey
-- Corrige el trigger set_registrado_por_default() para validar la existencia en public.profiles antes de asignar

-- 1. Actualizar función del trigger
CREATE OR REPLACE FUNCTION public.set_registrado_por_default()
RETURNS trigger AS $$
BEGIN
    -- Si el payload trae un registrado_por que no existe en profiles, anularlo para no romper la FK
    IF NEW.registrado_por IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.registrado_por) THEN
            NEW.registrado_por := NULL;
        END IF;
    END IF;

    -- Si registrado_por es NULL, asignar auth.uid() ÚNICAMENTE si existe en profiles
    IF NEW.registrado_por IS NULL THEN
        IF auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid()) THEN
            NEW.registrado_por := auth.uid();
        ELSE
            NEW.registrado_por := NULL;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Asegurar que el trigger esté activo en la tabla electores
DROP TRIGGER IF EXISTS trg_set_registrado_por ON public.electores;
CREATE TRIGGER trg_set_registrado_por
    BEFORE INSERT ON public.electores
    FOR EACH ROW EXECUTE FUNCTION public.set_registrado_por_default();
