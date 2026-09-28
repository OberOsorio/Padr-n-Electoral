-- ==============================================================================
-- MIGRACIÓN: 20260928000016_divipole_congreso_2026.sql
-- Tabla oficial DIVIPOLE Congreso 2026 (Registraduría Nacional del Estado Civil)
-- ==============================================================================

create table if not exists public.divipole_puestos_2026 (
  id text primary key,
  dd text not null,
  mm text not null,
  zz text not null,
  pp text not null,
  departamento text not null,
  municipio text not null,
  name text not null,
  zone text not null,
  total_mesas integer not null default 1,
  address text,
  censo integer default 0,
  lat double precision,
  lng double precision,
  citrep text,
  created_at timestamptz not null default now()
);

-- Índices de alto rendimiento para búsqueda rápida por circunscripción, municipio y nombre
create index if not exists idx_divipole_dept on public.divipole_puestos_2026(lower(departamento));
create index if not exists idx_divipole_dept_muni on public.divipole_puestos_2026(lower(departamento), lower(municipio));
create index if not exists idx_divipole_citrep on public.divipole_puestos_2026(citrep) where citrep is not null;

-- Habilitar RLS con lectura pública para todas las campañas
alter table public.divipole_puestos_2026 enable row level security;

drop policy if exists "Lectura publica de puestos divipole" on public.divipole_puestos_2026;
create policy "Lectura publica de puestos divipole"
  on public.divipole_puestos_2026 for select
  using (true);

-- RPC para consultar puestos por departamento y municipio
create or replace function public.obtener_puestos_divipole(
  p_departamento text default null,
  p_municipio text default null,
  p_search text default null,
  p_limit integer default 200
)
returns table (
  id text,
  name text,
  zone text,
  total_mesas integer,
  departamento text,
  municipio text,
  address text,
  censo integer,
  lat double precision,
  lng double precision,
  citrep text
)
language plpgsql stable security definer as $$
begin
  return query
  select 
    d.id,
    d.name,
    d.zone,
    d.total_mesas,
    d.departamento,
    d.municipio,
    d.address,
    d.censo,
    d.lat,
    d.lng,
    d.citrep
  from public.divipole_puestos_2026 d
  where (
    p_departamento is null or 
    lower(unaccent(d.departamento)) = lower(unaccent(p_departamento))
  )
  and (
    p_municipio is null or 
    lower(unaccent(d.municipio)) = lower(unaccent(p_municipio))
  )
  and (
    p_search is null or 
    d.name ilike '%' || p_search || '%' or
    d.zone ilike '%' || p_search || '%'
  )
  order by d.zone asc, d.name asc
  limit p_limit;
end;
$$;

grant execute on function public.obtener_puestos_divipole(text, text, text, integer) to anon, authenticated, service_role;
