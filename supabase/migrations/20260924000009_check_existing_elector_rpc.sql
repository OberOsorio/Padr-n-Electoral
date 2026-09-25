-- ==============================================================================
-- MIGRACIÓN: 20260924000009_check_existing_elector_rpc.sql
-- Función RPC para verificación anti-colisión y trazabilidad de registro
-- ==============================================================================

create or replace function public.check_existing_elector(
  p_cedula text,
  p_tenant_id uuid
)
returns table (
  id uuid,
  cedula text,
  nombres text,
  apellidos text,
  telefono text,
  puesto_votacion text,
  mesa integer,
  created_at timestamp with time zone,
  registrado_por_nombre text,
  registrado_por_rol text
) language plpgsql security definer as $$
begin
  return query
  select 
    e.id,
    e.cedula,
    e.nombres,
    e.apellidos,
    e.telefono,
    e.puesto_votacion,
    e.mesa,
    e.created_at,
    coalesce(p.full_name, 'Personal Autorizado') as registrado_por_nombre,
    coalesce(p.role::text, 'admin') as registrado_por_rol
  from public.electores e
  left join public.profiles p on p.id = e.registrado_por
  where e.cedula = p_cedula 
    and e.tenant_id = p_tenant_id
  limit 1;
end;
$$;

-- Permisos de ejecución
grant execute on function public.check_existing_elector(text, uuid) to authenticated;
grant execute on function public.check_existing_elector(text, uuid) to anon;
