-- ==============================================================================
-- Migración: 20260928000022_proteger_administrador_campana.sql
-- Módulo: Seguridad y Blindaje SQL del Administrador Principal
-- Propósito: Garantizar la inmutabilidad a nivel de motor ACID del rol y estado
-- activo de los administradores y titulares de campaña en public.profiles.
-- ==============================================================================

-- 1. Función de control para proteger la inmutabilidad de la cuenta Admin
create or replace function public.proteger_administrador_campana()
returns trigger language plpgsql security definer as $$
begin
  -- Si el registro que se intenta modificar pertenece a un usuario con rol 'admin'
  if old.role = 'admin' then
    -- Impedir degradación de rol
    if new.role is distinct from old.role then
      raise exception 'Operación rechazada: El rol del Administrador Principal es inmutable y no puede ser alterado.';
    end if;

    -- Impedir desactivación o suspensión
    if new.is_active is distinct from old.is_active and new.is_active = false then
      raise exception 'Operación rechazada: La cuenta del Titular de Campaña no puede ser suspendida.';
    end if;
  end if;

  return new;
end;
$$;

-- 2. Vincular el trigger BEFORE UPDATE sobre la tabla profiles
drop trigger if exists tr_proteger_admin on public.profiles;

create trigger tr_proteger_admin
before update on public.profiles
for each row
execute function public.proteger_administrador_campana();
