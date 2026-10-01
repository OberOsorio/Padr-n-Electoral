-- Migración: Permitir lectura pública/autenticada de perfiles para selector de líderes y reportes
-- Evita bloqueos por RLS cuando los usuarios consultan la lista de líderes o registradores del padrón

DROP POLICY IF EXISTS "Permitir leer perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow read profiles" ON public.profiles;

CREATE POLICY "Permitir leer perfiles"
ON public.profiles
FOR SELECT
TO public
USING (true);
