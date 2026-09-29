-- ==============================================================================
-- Migración: Habilitar Supabase Realtime en la tabla public.electores
-- Fecha: 2026-09-29
-- Propósito: Permitir suscripción WebSocket a eventos INSERT, UPDATE y DELETE
-- ==============================================================================

DO $$
BEGIN
  -- Verificar si la tabla electores ya está en la publicación supabase_realtime
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'electores'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.electores;
  END IF;
END $$;
