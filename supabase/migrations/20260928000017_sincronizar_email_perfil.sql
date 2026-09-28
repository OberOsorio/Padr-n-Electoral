-- Migration: 20260928000017_sincronizar_email_perfil.sql
-- Sincronización automática de email real desde auth.users a public.profiles

-- 1. Agregar columna email a public.profiles si no existe
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Actualizar perfiles existentes con el email real de auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id;

-- 3. Función y trigger para mantener el email sincronizado en updates de auth.users
CREATE OR REPLACE FUNCTION public.sincronizar_email_perfil()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles
  SET email = new.email
  WHERE id = new.id;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS tr_sincronizar_email_perfil ON auth.users;
CREATE TRIGGER tr_sincronizar_email_perfil
AFTER UPDATE OF email ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sincronizar_email_perfil();

-- 4. Actualizar trigger handle_new_user para incluir email en nuevos registros
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, is_active, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'coordinador'::public.app_role),
        true,
        NEW.email
    )
    ON CONFLICT (id) DO UPDATE
    SET email = COALESCE(EXCLUDED.email, public.profiles.email),
        full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);
    RETURN NEW;
END;
$$;
