import { useState, useEffect, useCallback, useRef } from 'react';
import type { AccessAuditLog, AppRole } from '../../types';

const AUDIT_LOGS_KEY = 'electoral_saas_access_logs';

export const INITIAL_AUDIT_LOGS: AccessAuditLog[] = [];

export const useAccessAuditLogs = () => {
  const [logs, setLogs] = useState<AccessAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  const fetchLogs = useCallback(() => {
    try {
      const stored = localStorage.getItem(AUDIT_LOGS_KEY);
      if (stored) {
        const parsed: AccessAuditLog[] = JSON.parse(stored);
        const clean = parsed.filter(
          (l) => !['plan_upgrade', 'tenant_quota_changed'].includes(l.event_type) &&
                 !l.description?.toLowerCase().includes('cuota') &&
                 !l.description?.toLowerCase().includes('elector')
        );
        if (clean.length !== parsed.length) {
          localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(clean));
        }
        setLogs(clean);
      } else {
        setLogs([]);
      }
    } catch (e) {
      console.error('Error al leer access logs:', e);
      setLogs([]);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, []);

  const recordAccessEvent = useCallback(
    (event: {
      user_email: string;
      user_name: string;
      user_role: AppRole;
      tenant_name?: string;
      tenant_id?: string | null;
      event_type: AccessAuditLog['event_type'];
      description: string;
      ip_address?: string;
    }) => {
      const newEntry: AccessAuditLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        user_email: event.user_email,
        user_name: event.user_name,
        user_role: event.user_role,
        tenant_name: event.tenant_name || 'Plataforma Global',
        tenant_id: event.tenant_id ?? null,
        ip_address: event.ip_address || '186.84.90.12',
        user_agent: navigator.userAgent.includes('Mobile') ? 'Mobile Browser' : 'Desktop Browser',
        event_type: event.event_type,
        description: event.description,
        created_at: new Date().toISOString(),
      };

      setLogs((prev) => {
        const updated = [newEntry, ...prev].slice(0, 150);
        localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(updated));
        return updated;
      });

      return newEntry;
    },
    []
  );

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
    refetchLogs: fetchLogs,
    recordAccessEvent,
  };
};
