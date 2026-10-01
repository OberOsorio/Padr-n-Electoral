import { supabase } from '../../lib/supabase';

export async function registrarEventoAuditoria(params: {
  userEmail: string;
  userName?: string;
  userRole?: string;
  eventType: string;
  severity?: 'INFO' | 'WARNING' | 'CRITICAL';
  tenantName?: string;
  actionDetail: string;
}) {
  try {
    const rawStr = `${params.eventType}_${params.userEmail}_${Date.now()}`;
    let sha256Hash = '';
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const msgBuffer = new TextEncoder().encode(rawStr);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      sha256Hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } else {
      sha256Hash = Math.random().toString(16).slice(2) + Date.now().toString(16);
    }

    await (supabase.from('security_audit_logs') as any).insert({
      user_email: params.userEmail,
      user_name: params.userName || 'Administrador',
      user_role: params.userRole || 'admin',
      event_type: params.eventType,
      severity: params.severity || 'INFO',
      tenant_name: params.tenantName || 'TODO POR COTORRA',
      ip_address: '186.84.90.12',
      device_info: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 48) : 'Web Client',
      action_detail: params.actionDetail,
      sha256_hash: sha256Hash,
    });
  } catch {
    // Non-blocking audit log
  }
}

export async function enviarSolicitudRecuperacion(email: string, nombreCompleto: string) {
  if (!email) {
    throw new Error('El usuario no posee un correo electrónico registrado.');
  }

  // Despacho del enlace de recuperación seguro
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    console.error('[Auth Recovery] Error enviando correo de recuperación:', error.message);
    throw error;
  }

  await registrarEventoAuditoria({
    userEmail: email.trim(),
    userName: nombreCompleto,
    eventType: 'PASSWORD_RESET',
    severity: 'WARNING',
    actionDetail: `Envío de enlace de recuperación de contraseña asistida a ${nombreCompleto}`,
  });

  return { success: true, email, nombreCompleto };
}
