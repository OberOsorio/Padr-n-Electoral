-- ==============================================================================
-- MIGRACIÓN: 20260924000007_multitenant_architecture.sql
-- Arquitectura Multi-Tenant B2B SaaS con Aislamiento Estricto por Tenant y RLS
-- ==============================================================================

-- 1. Tabla Maestra de Campañas / Organizaciones (Tenants)
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null, -- Ej. "Campaña Alcaldía 2027", "Partido Progresista"
  slug text unique not null,
  plan text not null default 'standard' check (plan in ('standard', 'pro', 'enterprise')),
  max_electors integer default 10000,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. Modificar / Actualizar tabla profiles para vincular a Tenant y rol superadmin
alter type public.app_role add value if not exists 'superadmin';

alter table public.profiles 
  add column if not exists tenant_id uuid references public.tenants(id) on delete set null;

-- 3. Vincular tenant_id a todas las tablas operativas del sistema
alter table public.electores 
  add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

-- Tabla opcional de puestos de votacion si existe en base de datos
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'puestos_votacion') then
    alter table public.puestos_votacion add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;
  end if;
end $$;

alter table public.export_logs 
  add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

-- 4. Función de utilidad para obtener el tenant_id del usuario en sesión
create or replace function public.get_auth_tenant_id()
returns uuid as $$
  select tenant_id from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- 5. Función para verificar si el usuario es superadmin
create or replace function public.is_superadmin()
returns boolean as $$
  select exists (
    select 1 from public.profiles 
    where id = auth.uid() and role = 'superadmin'
  );
$$ language sql stable security definer;

-- 6. Políticas RLS con Aislamiento Estricto
-- Tenants
alter table public.tenants enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'tenants' and policyname = 'Superadmin gestiona tenants') then
    create policy "Superadmin gestiona tenants"
      on public.tenants for all
      using (public.is_superadmin());
  end if;

  if not exists (select 1 from pg_policies where tablename = 'tenants' and policyname = 'Usuarios leen su propio tenant') then
    create policy "Usuarios leen su propio tenant"
      on public.tenants for select
      using (id = public.get_auth_tenant_id());
  end if;
end $$;

-- Profiles: Aislamiento por Tenant
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Aislamiento total profiles') then
    create policy "Aislamiento total profiles"
      on public.profiles for all
      using (
        public.is_superadmin() or tenant_id = public.get_auth_tenant_id() or id = auth.uid()
      )
      with check (
        public.is_superadmin() or tenant_id = public.get_auth_tenant_id() or id = auth.uid()
      );
  end if;
end $$;

-- Electores: Aislamiento total por Tenant
alter table public.electores enable row level security;

do $$
begin
  -- Eliminar políticas previas no restringidas por tenant si existen
  drop policy if exists "Todos pueden ver electores" on public.electores;
  drop policy if exists "Lectura publica electores" on public.electores;
  drop policy if exists "Usuarios autenticados pueden registrar electores" on public.electores;
  drop policy if exists "Administradores pueden actualizar electores" on public.electores;
  
  if not exists (select 1 from pg_policies where tablename = 'electores' and policyname = 'Aislamiento total electores') then
    create policy "Aislamiento total electores"
      on public.electores for all
      using (
        public.is_superadmin() or tenant_id = public.get_auth_tenant_id()
      )
      with check (
        public.is_superadmin() or tenant_id = public.get_auth_tenant_id()
      );
  end if;
end $$;

-- Export Logs: Aislamiento por Tenant
alter table public.export_logs enable row level security;

do $$
begin
  drop policy if exists "Lectura de historial de exportaciones" on public.export_logs;
  drop policy if exists "Registro de evento de descarga" on public.export_logs;
  
  if not exists (select 1 from pg_policies where tablename = 'export_logs' and policyname = 'Aislamiento total logs exportacion') then
    create policy "Aislamiento total logs exportacion"
      on public.export_logs for all
      using (
        public.is_superadmin() or tenant_id = public.get_auth_tenant_id()
      )
      with check (
        public.is_superadmin() or tenant_id = public.get_auth_tenant_id()
      );
  end if;
end $$;

-- Índices de alto rendimiento para multi-tenancy
create index if not exists idx_profiles_tenant_id on public.profiles(tenant_id);
create index if not exists idx_electores_tenant_id on public.electores(tenant_id);
create index if not exists idx_export_logs_tenant_id on public.export_logs(tenant_id);
create index if not exists idx_tenants_slug on public.tenants(slug);
