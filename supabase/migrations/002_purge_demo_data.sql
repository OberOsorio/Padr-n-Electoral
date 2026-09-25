-- ==============================================================================
-- RESET COMPLETO A CERO (Production Data Purge)
-- Purga todas las campañas, electores, usuarios secundarios y logs.
-- Preserva herméticamente la cuenta del SuperAdmin (dueño de la plataforma).
-- ==============================================================================

begin;

-- 1. Eliminar todas las tablas operativas hijas en cascada
truncate table public.export_logs cascade;
truncate table public.audit_logs cascade;
truncate table public.electores cascade;

do $$
begin
  if exists (select from pg_tables where schemaname = 'public' and tablename = 'puestos_votacion') then
    truncate table public.puestos_votacion cascade;
  end if;
end $$;

-- 2. Eliminar perfiles de usuarios que no sean SuperAdmin
delete from public.profiles
where role <> 'superadmin';

-- 3. Eliminar usuarios en auth.users excepto el SuperAdmin
delete from auth.users
where id not in (
  select id from public.profiles where role = 'superadmin'
);

-- 4. Eliminar todas las campañas (tenants)
delete from public.tenants;

-- 5. Asegurar que el SuperAdmin quede desvinculado de cualquier tenant previo
update public.profiles
set tenant_id = null
where role = 'superadmin';

commit;
