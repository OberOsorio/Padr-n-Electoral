-- ==============================================================================
-- MIGRACIÓN: 20260924000006_create_export_logs.sql
-- Tabla de auditoría para registro y trazabilidad de descargas de datos
-- ==============================================================================

create table if not exists public.export_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  user_name text not null,
  user_email text not null,
  user_role text not null,
  record_count integer not null default 0,
  export_format text not null check (export_format in ('xlsx', 'csv')),
  filters_summary text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Habilitar Seguridad a Nivel de Fila (RLS)
alter table public.export_logs enable row level security;

-- Política de lectura: Administradores ven todo; coordinadores ven solo sus propias descargas
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'export_logs' and policyname = 'Lectura de historial de exportaciones'
  ) then
    create policy "Lectura de historial de exportaciones"
      on public.export_logs for select
      using (
        auth.uid() = user_id 
        or exists (
          select 1 from public.profiles 
          where id = auth.uid() and role = 'admin'
        )
      );
  end if;

  -- Política de inserción para registrar el evento de descarga
  if not exists (
    select 1 from pg_policies where tablename = 'export_logs' and policyname = 'Registro de evento de descarga'
  ) then
    create policy "Registro de evento de descarga"
      on public.export_logs for insert
      with check (auth.uid() = user_id or auth.uid() is not null);
  end if;
end $$;

-- Índice para optimizar consultas de auditoría ordenadas cronológicamente
create index if not exists idx_export_logs_created_at on public.export_logs(created_at desc);
create index if not exists idx_export_logs_user_id on public.export_logs(user_id);
