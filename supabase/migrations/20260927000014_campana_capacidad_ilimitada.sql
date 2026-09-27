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

-- Eliminar restricción check de planes obsoletos
alter table public.tenants drop constraint if exists tenants_plan_check;

alter table public.tenants
  add column if not exists es_ilimitado boolean not null default true,
  add column if not exists departamento text,
  add column if not exists municipio text,
  add column if not exists admin_name text,
  add column if not exists admin_email text;

-- Actualizar registros existentes para asegurar capacidad ilimitada
update public.tenants
set es_ilimitado = true
where es_ilimitado is null or es_ilimitado = false;

-- 2. Asegurar perfil del SuperAdmin
insert into public.profiles (id, full_name, role, is_active)
select id, 'Ober Osorio', 'superadmin'::public.app_role, true
from auth.users
where email = 'oberosorio1@gmail.com'
on conflict (id) do update set role = 'superadmin'::public.app_role, is_active = true;

-- 3. Actualizar función is_superadmin para garantizar acceso total al SuperAdmin
create or replace function public.is_superadmin()
returns boolean as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'superadmin'
  ) or (coalesce(auth.jwt() ->> 'email', '') = 'oberosorio1@gmail.com');
$$ language sql stable security definer;

-- 4. Actualizar políticas RLS de tenants para permitir lectura global y gestión por SuperAdmin
alter table public.tenants enable row level security;

drop policy if exists "Usuarios leen su propio tenant" on public.tenants;
drop policy if exists "Lectura de tenants" on public.tenants;
drop policy if exists "Superadmin gestiona tenants" on public.tenants;

create policy "Lectura de tenants"
  on public.tenants for select
  using (true);

create policy "Superadmin gestiona tenants"
  on public.tenants for all
  using (public.is_superadmin())
  with check (public.is_superadmin());

-- 5. Función RPC de aprovisionamiento de campañas con capacidad de padrón ilimitada
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
  if not public.is_superadmin() then
    raise exception 'No autorizado. Solo el SuperAdmin puede crear campañas.';
  end if;

  -- Insertar campaña con capacidad ilimitada y metadatos de admin
  insert into public.tenants (
    name,
    slug,
    is_active,
    es_ilimitado,
    departamento,
    municipio,
    admin_name,
    admin_email
  )
  values (
    trim(p_nombre),
    lower(trim(p_slug)),
    true,
    true,
    nullif(trim(p_departamento), ''),
    nullif(trim(p_municipio), ''),
    nullif(trim(p_admin_nombre), ''),
    nullif(lower(trim(p_admin_email)), '')
  )
  returning id into v_tenant_id;

  return jsonb_build_object(
    'success', true,
    'tenant_id', v_tenant_id,
    'message', 'Campaña aprovisionada con capacidad de padrón ilimitada'
  );
end;
$$;
