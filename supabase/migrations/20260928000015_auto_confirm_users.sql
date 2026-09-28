-- ==============================================================================
-- MIGRACIÓN: 20260928000015_auto_confirm_users.sql
-- Garantizar auto-confirmación inmediata de correos para todos los usuarios
-- ==============================================================================

-- 1. Confirmar inmediatamente todos los usuarios existentes en auth.users
update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;

-- 2. Crear función de autoconfirmación antes de insertar en auth.users
create or replace function public.auto_confirm_auth_user()
returns trigger as $$
begin
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end;
$$ language plpgsql security definer;

-- 3. Crear trigger para interceptar inserciones en auth.users
drop trigger if exists tr_auto_confirm_auth_users on auth.users;
create trigger tr_auto_confirm_auth_users
  before insert on auth.users
  for each row execute function public.auto_confirm_auth_user();

-- 4. RPC para confirmar usuario por email bajo demanda
create or replace function public.confirmar_usuario_por_email(p_email text)
returns jsonb
language plpgsql security definer as $$
declare
  v_count integer;
begin
  update auth.users
  set email_confirmed_at = coalesce(email_confirmed_at, now())
  where lower(trim(email)) = lower(trim(p_email));
  
  get diagnostics v_count = row_count;
  
  return jsonb_build_object('success', true, 'updated', v_count);
end;
$$;

-- Permitir a usuarios anónimos y autenticados invocar la función de confirmación por email
grant execute on function public.confirmar_usuario_por_email(text) to anon, authenticated, service_role;
