-- ==============================================================================
-- MIGRACIÓN: 20260925000010_censo_maestro_autocomplete.sql
-- Tabla de Censo Maestro Local y RPC optimizada para autocompletado instantáneo (<50ms)
-- ==============================================================================

-- 1. Tabla de censo maestro precargado
create table if not exists public.censo_maestro (
  id uuid primary key default gen_random_uuid(),
  cedula text unique not null,
  nombres text not null,
  apellidos text not null,
  puesto_sugerido text,
  mesa_sugerida integer,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Índice B-Tree optimizado para búsquedas instantáneas por documento
create index if not exists idx_censo_cedula on public.censo_maestro (cedula);

-- Habilitar Row Level Security (RLS)
alter table public.censo_maestro enable row level security;

-- Política de lectura segura para usuarios autenticados
drop policy if exists "Consulta de censo para usuarios autenticados" on public.censo_maestro;
create policy "Consulta de censo para usuarios autenticados"
  on public.censo_maestro for select
  using (auth.role() = 'authenticated');

-- Permitir lectura si anon key se usa en desarrollo
drop policy if exists "Consulta de censo para usuarios anon" on public.censo_maestro;
create policy "Consulta de censo para usuarios anon"
  on public.censo_maestro for select
  using (true);

-- 2. Función RPC optimizada para búsqueda directa de ciudadano
create or replace function public.buscar_ciudadano_censo(p_cedula text)
returns table (
  found boolean,
  nombres text,
  apellidos text,
  puesto_sugerido text,
  mesa_sugerida integer
) language plpgsql security definer as $$
declare
  v_rec record;
begin
  select c.nombres, c.apellidos, c.puesto_sugerido, c.mesa_sugerida
  into v_rec
  from public.censo_maestro c
  where c.cedula = trim(p_cedula)
  limit 1;

  if found then
    return query select true, v_rec.nombres, v_rec.apellidos, v_rec.puesto_sugerido, v_rec.mesa_sugerida;
  else
    return query select false, null::text, null::text, null::text, null::integer;
  end if;
end;
$$;

-- Permisos de ejecución de la función RPC
grant execute on function public.buscar_ciudadano_censo(text) to authenticated;
grant execute on function public.buscar_ciudadano_censo(text) to anon;

-- 3. Datos iniciales de demostración para pruebas inmediatas del Censo Maestro
insert into public.censo_maestro (cedula, nombres, apellidos, puesto_sugerido, mesa_sugerida)
values 
  ('1047892341', 'Carlos Eduardo', 'Mendoza Ospina', 'I.E. Santander Central', 4),
  ('1098341902', 'Laura Sofía', 'Herrera Morales', 'Coliseo Municipal de Deportes', 2),
  ('73542189', 'Miguel Ángel', 'Morales Torres', 'Colegio Mayor Departamental', 7),
  ('1143670554', 'Valentina', 'Restrepo Castro', 'I.E. Técnico San Juan Bautista', 1),
  ('1052884112', 'Andrés Felipe', 'Gómez Ortiz', 'Escuela Mixta El Prado', 3),
  ('1085294019', 'Esteban Camilo', 'Torres Valderrama', 'I.E. Santander Central', 4),
  ('528391145', 'María Lucía', 'Pérez Domínguez', 'Coliseo Municipal de Deportes', 2),
  ('1098456432', 'Andrés Felipe', 'Ramírez Gómez', 'I.E. Santander Central', 4),
  ('43987123', 'Carmen Rosa', 'Vargas Silva', 'Colegio Mayor Departamental', 6),
  ('1047892903', 'Jhonatan David', 'Montoya Restrepo', 'I.E. Técnico San Juan Bautista', 1),
  ('1020304050', 'Juliana Patricia', 'Salazar Cardona', 'I.E. Santander Central', 3),
  ('1030405060', 'Diego Fernando', 'Castro Muñoz', 'Coliseo Municipal de Deportes', 5)
on conflict (cedula) do update set
  nombres = excluded.nombres,
  apellidos = excluded.apellidos,
  puesto_sugerido = excluded.puesto_sugerido,
  mesa_sugerida = excluded.mesa_sugerida;
