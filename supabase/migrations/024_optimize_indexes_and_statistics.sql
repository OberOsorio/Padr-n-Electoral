BEGIN;

-- 1. Índice compuesto ultrarrápido para búsqueda de electores por tenant y cédula
CREATE INDEX IF NOT EXISTS idx_electores_tenant_cedula 
ON public.electores(tenant_id, cedula);

-- 2. Índice B-Tree exclusivo para cédula
CREATE INDEX IF NOT EXISTS idx_electores_cedula 
ON public.electores(cedula);

-- 3. Índice para filtros territoriales y puestos
CREATE INDEX IF NOT EXISTS idx_electores_puesto_mesa 
ON public.electores(tenant_id, puesto_votacion, mesa);

-- 4. Optimización de estadísticas del planificador de PostgreSQL
ANALYZE public.electores;
ANALYZE public.profiles;
ANALYZE public.tenants;

COMMIT;
