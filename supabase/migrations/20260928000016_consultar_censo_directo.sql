-- ==============================================================================
-- MIGRACIÓN: 20260928000016_consultar_censo_directo.sql
-- Herramienta operativa de consulta directa de lugar de votación
-- ==============================================================================

-- 1. Asegurar columnas de ubicación territorial en censo_maestro
alter table public.censo_maestro
  add column if not exists departamento text,
  add column if not exists municipio text,
  add column if not exists direccion text;

-- 2. Función RPC para consultar el censo oficial y lugar de votación
create or replace function public.consultar_censo_directo(p_cedula text)
returns table (
  encontrado boolean,
  cedula text,
  nombres text,
  apellidos text,
  departamento text,
  municipio text,
  puesto text,
  mesa integer,
  direccion text
) language plpgsql security definer as $$
declare
  v_clean text := trim(regexp_replace(p_cedula, '\D', '', 'g'));
  v_rec record;
begin
  if length(v_clean) < 4 then
    return query select false, null::text, null::text, null::text, null::text, null::text, null::text, null::integer, null::text;
    return;
  end if;

  -- 1. Búsqueda en censo_maestro oficial
  select c.cedula, c.nombres, c.apellidos, 
         coalesce(c.departamento, 'Córdoba') as departamento, 
         coalesce(c.municipio, 'Montería') as municipio, 
         coalesce(c.puesto_sugerido, 'Colegio Nacional') as puesto, 
         coalesce(c.mesa_sugerida, 1) as mesa, 
         coalesce(c.direccion, '') as direccion
  into v_rec
  from public.censo_maestro c
  where c.cedula = v_clean
  limit 1;

  if found then
    return query select 
      true, 
      v_rec.cedula, 
      v_rec.nombres, 
      v_rec.apellidos, 
      v_rec.departamento, 
      v_rec.municipio, 
      v_rec.puesto, 
      v_rec.mesa, 
      v_rec.direccion;
  else
    -- 2. Fallback de búsqueda en padrón electoral de electores
    select e.cedula, e.nombres, e.apellidos, 
           coalesce(e.departamento, 'Córdoba') as departamento, 
           coalesce(e.municipio, 'Montería') as municipio, 
           coalesce(e.puesto_votacion, 'Puesto Asignado') as puesto, 
           coalesce(e.mesa, 1) as mesa, 
           coalesce(e.direccion, '') as direccion
    into v_rec
    from public.electores e
    where e.cedula = v_clean
    limit 1;

    if found then
      return query select 
        true, 
        v_rec.cedula, 
        v_rec.nombres, 
        v_rec.apellidos, 
        v_rec.departamento, 
        v_rec.municipio, 
        v_rec.puesto, 
        v_rec.mesa, 
        v_rec.direccion;
    else
      return query select false, v_clean, null::text, null::text, null::text, null::text, null::text, null::integer, null::text;
    end if;
  end if;
end;
$$;

grant execute on function public.consultar_censo_directo(text) to authenticated, anon, service_role;
