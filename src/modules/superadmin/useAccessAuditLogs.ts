import { useState, useEffect, useCallback, useRef } from 'react';
import type { AccessAuditLog, AppRole } from '../../types';

const AUDIT_LOGS_KEY = 'electoral_saas_access_logs';

export const INITIAL_AUDIT_LOGS: AccessAuditLog[] = [
  {
    id: 'log-001',
    user_email: 'superadmin@saas.gov',
    user_name: 'SuperAdmin Maestro',
    user_role: 'superadmin',
    tenant_name: 'Plataforma Global',
    tenant_id: null,
    ip_address: '186.84.90.12',
    user_agent: 'Chrome 128 • macOS Sequoia',
    event_type: 'login_success',
    description: 'Inicio de sesión exitoso en Master Control Panel (2FA verificado)',
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: 'log-002',
    user_email: 'admin@alcaldia2027.gov',
    user_name: 'Dr. Alejandro Morales',
    user_role: 'admin',
    tenant_name: 'Campaña Alcaldía 2027',
    tenant_id: 'ten_alcaldia_2027',
    ip_address: '190.157.12.84',
    user_agent: 'Firefox 130 • Windows 11',
    event_type: 'login_success',
    description: 'Acceso autenticado al panel directivo de campaña',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'log-003',
    user_email: 'superadmin@saas.gov',
    user_name: 'SuperAdmin Maestro',
    user_role: 'superadmin',
    tenant_name: 'Cauca Unido 2026',
    tenant_id: 'ten_cauca_unido',
    ip_address: '186.84.90.12',
    user_agent: 'Chrome 128 • macOS Sequoia',
    event_type: 'campaign_suspended',
    description: 'Suspensión temporal por protocolo de seguridad y revisión de directivas',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'log-004',
    user_email: 'coordinador@alcaldia2027.gov',
    user_name: 'Cdor. Javier Rivas',
    user_role: 'coordinador',
    tenant_name: 'Campaña Alcaldía 2027',
    tenant_id: 'ten_alcaldia_2027',
    ip_address: '181.143.65.201',
    user_agent: 'Safari 18 • iOS 18 (Mobile)',
    event_type: 'login_success',
    description: 'Ingreso operativo desde terminal móvil de campo autorizado',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 'log-005',
    user_email: 'sofia.carvajal@partidoprogresista.org',
    user_name: 'Ing. Sofía Carvajal',
    user_role: 'admin',
    tenant_name: 'Partido Progresista Central',
    tenant_id: 'ten_partido_progresista',
    ip_address: '190.144.200.45',
    user_agent: 'Edge 128 • Windows 11',
    event_type: 'data_export',
    description: 'Exportación institucional de padrón auditada con firma criptográfica SHA-256',
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
  {
    id: 'log-006',
    user_email: 'rodrigo.benitez@caucaunido.org',
    user_name: 'Rodrigo Benítez',
    user_role: 'admin',
    tenant_name: 'Cauca Unido 2026',
    tenant_id: 'ten_cauca_unido',
    ip_address: '186.28.14.77',
    user_agent: 'Chrome 127 • Android 14',
    event_type: 'login_failed',
    description: 'Intento de ingreso bloqueado: Campaña en estado Suspendido',
    created_at: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
  },
  {
    id: 'log-007',
    user_email: 'admin@alcaldia2027.gov',
    user_name: 'Dr. Alejandro Morales',
    user_role: 'admin',
    tenant_name: 'Campaña Alcaldía 2027',
    tenant_id: 'ten_alcaldia_2027',
    ip_address: '190.157.12.84',
    user_agent: 'Firefox 130 • Windows 11',
    event_type: 'password_change',
    description: 'Actualización periódica de contraseña corporativa y rotación de tokens',
    created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
  },
  {
    id: 'log-008',
    user_email: 'superadmin@saas.gov',
    user_name: 'SuperAdmin Maestro',
    user_role: 'superadmin',
    tenant_name: 'Cauca Unido 2026',
    tenant_id: 'ten_cauca_unido',
    ip_address: '186.84.90.12',
    user_agent: 'Chrome 128 • macOS Sequoia',
    event_type: 'campaign_activated',
    description: 'Reactivación formal de campaña tras validación de políticas de acceso',
    created_at: new Date(Date.now() - 1000 * 60 * 940).toISOString(),
  },
  {
    id: 'log-009',
    user_email: 'intruder@unknown.net',
    user_name: 'Desconocido',
    user_role: 'coordinador',
    tenant_name: 'Plataforma Global',
    tenant_id: null,
    ip_address: '45.154.255.89',
    user_agent: 'Python Requests / Scraper bot',
    event_type: 'login_failed',
    description: 'Bloqueo automático de IP por exceso de peticiones fallidas (Cloudflare WAF)',
    created_at: new Date(Date.now() - 1000 * 60 * 1200).toISOString(),
  },
];

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
        setLogs(clean.length > 0 ? clean : INITIAL_AUDIT_LOGS);
      } else {
        localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(INITIAL_AUDIT_LOGS));
        setLogs(INITIAL_AUDIT_LOGS);
      }
    } catch (e) {
      console.error('Error al leer access logs:', e);
      setLogs(INITIAL_AUDIT_LOGS);
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
