-- Migration: 20260928000018_add_permissions_to_profiles.sql
-- Permisos granulares de acceso en public.profiles

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{
  "can_register_electors": true,
  "can_view_all_electors": false,
  "can_use_bulk_import": false,
  "can_export_reports": false,
  "can_query_registraduria": true
}'::jsonb;

-- Actualizar administradores para tener todos los permisos activos por defecto
UPDATE public.profiles
SET permissions = '{
  "can_register_electors": true,
  "can_view_all_electors": true,
  "can_use_bulk_import": true,
  "can_export_reports": true,
  "can_query_registraduria": true
}'::jsonb
WHERE role = 'admin' OR role = 'superadmin';

-- Actualizar coordinadores para tener permisos de coordinador por defecto
UPDATE public.profiles
SET permissions = '{
  "can_register_electors": true,
  "can_view_all_electors": true,
  "can_use_bulk_import": true,
  "can_export_reports": true,
  "can_query_registraduria": true
}'::jsonb
WHERE role = 'coordinador';
