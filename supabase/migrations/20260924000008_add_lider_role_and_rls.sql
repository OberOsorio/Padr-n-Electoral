-- ==============================================================================
-- MIGRACIÓN: 20260924000008_add_lider_role_and_rls.sql
-- Incorporación del rol 'lider' y políticas de aislamiento de electores por RLS
-- ==============================================================================

-- 1. Agregar 'lider' al enum de roles si no existe
alter type public.app_role add value if not exists 'lider';

-- 2. Asegurar que cada elector guarde el id del líder que lo vinculó
-- (campo registrado_por ya apunta a profiles.id)

-- 3. Actualizar políticas RLS de la tabla electores para Líderes
drop policy if exists "Aislamiento total electores" on public.electores;
drop policy if exists "Politica de electores segun rol" on public.electores;

create policy "Politica de electores segun rol"
  on public.electores for all
  using (
    -- Superadmin ve todo
    public.is_superadmin()
    -- Admins y Coordinadores ven todos los electores de su tenant
    or (
      tenant_id = public.get_auth_tenant_id()
      and exists (
        select 1 from public.profiles
        where id = auth.uid() and role in ('admin', 'coordinador')
      )
    )
    -- Líderes ÚNICAMENTE ven los electores que ellos mismos registraron
    or (
      tenant_id = public.get_auth_tenant_id()
      and registrado_por = auth.uid()
      and exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'lider'
      )
    )
  )
  with check (
    -- Superadmin puede insertar/modificar
    public.is_superadmin()
    -- Admins y Coordinadores pueden insertar para su tenant
    or (
      tenant_id = public.get_auth_tenant_id()
      and exists (
        select 1 from public.profiles
        where id = auth.uid() and role in ('admin', 'coordinador')
      )
    )
    -- Líderes solo pueden registrar electores en su tenant y asignados a sí mismos
    or (
      tenant_id = public.get_auth_tenant_id()
      and registrado_por = auth.uid()
      and exists (
        select 1 from public.profiles
        where id = auth.uid() and role = 'lider'
      )
    )
  );

-- Índice para optimizar consultas de electores por líder asignado
create index if not exists idx_electores_registrado_por on public.electores(registrado_por);
