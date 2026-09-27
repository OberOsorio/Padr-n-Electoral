-- ==============================================================================
-- MIGRACIÓN: 20260927000014_campana_capacidad_ilimitada.sql
-- Eliminación de límites escalonados y transición a modelo de capacidad ilimitada
-- ==============================================================================

-- 1. Modificar tabla tenants para habilitar modelo ilimitado y ubicación territorial
alter table public.tenants
  alter column max_electors drop not null,
  alter column plan drop not null;

alter table public.tenants
  alter column max_electors set default null,
  alter column plan set default 'unlimited';

alter table public.tenants
  add column if not exists es_ilimitado boolean not null default true,
  add column if not exists departamento text,
  add column if not exists municipio text;

-- Actualizar registros existentes para asegurar capacidad ilimitada
update public.tenants
set es_ilimitado = true
where es_ilimitado is null or es_ilimitado = false;

-- 2. Función RPC de aprovisionamiento de campañas con capacidad de padrón ilimitada
create or replace function public.aprovisionar_nueva_campana(
  p_nombre text,
  p_slug text,
  p_departamento text default null,
  p_municipio text default null,
  p_admin_nombre text default null,
  p_admin_email text default null,
  p_admin_password text default null
)
returns jsonb
language plpgsql security definer as $$
declare
  v_tenant_id uuid;
begin
  -- Solo el superadmin puede aprovisionar campañas
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'superadmin'
  ) then
    raise exception 'No autorizado. Solo el SuperAdmin puede crear campañas.';
  end if;

  -- Insertar campaña con capacidad ilimitada
  insert into public.tenants (
    name,
    slug,
    is_active,
    es_ilimitado,
    departamento,
    municipio
  )
  values (
    trim(p_nombre),
    lower(trim(p_slug)),
    true,
    true,
    nullif(trim(p_departamento), ''),
    nullif(trim(p_municipio), '')
  )
  returning id into v_tenant_id;

  return jsonb_build_object(
    'success', true,
    'tenant_id', v_tenant_id,
    'message', 'Campaña aprovisionada con capacidad de padrón ilimitada'
  );
end;
$$;
