import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { ExportLog } from '../../types';
import { useTenant } from '../../context/TenantContext';

const LOCAL_STORAGE_KEY = 'electoral_audit_export_logs';

export const useExportLogs = () => {
  const [logs, setLogs] = useState<ExportLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const { currentTenantId } = useTenant();

  // 1. Obtener registros de auditoría
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Modo local / demo
    if (!isSupabaseConfigured) {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        const parsed: ExportLog[] = stored ? JSON.parse(stored) : [];
        const scoped = parsed.filter(
          (l) => !currentTenantId || l.tenant_id === currentTenantId || !l.tenant_id
        );
        if (isMountedRef.current) {
          setLogs(scoped);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error al leer historial local de auditoría:', err);
        if (isMountedRef.current) setLoading(false);
      }
      return;
    }

    // Modo conectado con Supabase y RLS activo
    try {
      let query = (supabase.from('export_logs') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(25);

      if (currentTenantId) {
        query = query.eq('tenant_id', currentTenantId);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      if (isMountedRef.current) {
        setLogs(data || []);
      }
    } catch (err: any) {
      console.error('Error al cargar historial de exportaciones:', err);
      // Fallback a localStorage si la tabla aún no existe o hay error de red
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored && isMountedRef.current) {
          const parsed = JSON.parse(stored);
          const scoped = parsed.filter(
            (l: ExportLog) => !currentTenantId || l.tenant_id === currentTenantId || !l.tenant_id
          );
          setLogs(scoped);
        }
      } catch {
        // Ignorar fallback
      }
      if (isMountedRef.current) {
        setError(err?.message || 'Error al conectar con el registro de auditoría');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [currentTenantId]);

  // 2. Registrar nuevo evento de exportación
  const recordExport = async (payload: {
    userId?: string | null;
    userName: string;
    userEmail: string;
    userRole: string;
    recordCount: number;
    exportFormat: 'xlsx' | 'csv';
    filtersSummary: string;
  }): Promise<ExportLog | null> => {
    const newLogItem: ExportLog = {
      id: crypto.randomUUID ? crypto.randomUUID() : `log_${Date.now()}`,
      user_id: payload.userId || null,
      user_name: payload.userName || 'Usuario del Sistema',
      user_email: payload.userEmail || 'usuario@electoral.gov',
      user_role: payload.userRole || 'Coordinador',
      record_count: payload.recordCount,
      export_format: payload.exportFormat,
      filters_summary: payload.filtersSummary,
      tenant_id: currentTenantId,
      created_at: new Date().toISOString(),
    };

    // Actualizar estado local inmediato para retroalimentación instantánea
    setLogs((prev) => [newLogItem, ...prev]);

    // Guardar en respaldo local
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      const existing: ExportLog[] = stored ? JSON.parse(stored) : [];
      const updated = [newLogItem, ...existing].slice(0, 100);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('No se pudo respaldar log localmente:', e);
    }

    // Si Supabase está configurado, insertar respetando RLS
    if (isSupabaseConfigured) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const activeUserId = session?.user?.id || payload.userId || null;

        const { error: insertError } = await (supabase.from('export_logs') as any).insert({
          user_id: activeUserId,
          user_name: payload.userName,
          user_email: payload.userEmail,
          user_role: payload.userRole,
          record_count: payload.recordCount,
          export_format: payload.exportFormat,
          filters_summary: payload.filtersSummary,
          ...(currentTenantId ? { tenant_id: currentTenantId } : {}),
        });

        if (insertError) {
          console.warn('Advertencia al insertar log en Supabase (usando respaldo local):', insertError);
        }
      } catch (err) {
        console.warn('Error al registrar evento de auditoría en Supabase:', err);
      }
    }

    return newLogItem;
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchLogs();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchLogs]);

  return {
    logs,
    loading,
    error,
    refetchLogs: fetchLogs,
    recordExport,
  };
};
