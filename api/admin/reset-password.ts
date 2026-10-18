import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEFAULT_SUPABASE_URL = 'https://gwerezjurmxuwcqousqg.supabase.co';
const DEFAULT_SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3ZXJlemp1cm14dXdjcW91c3FnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDM0ODA1MSwiZXhwIjoyMTA1OTI0MDUxfQ.Z4bqbeoCOZPoBRtw1uFENwXuLPHO5lU89MOQqYnBL1Y';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { userId, newPassword, adminRequesterId, userEmail, userName } = req.body || {};

    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos (userId, newPassword).' });
    }

    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
      DEFAULT_SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY no configurado en el servidor.' });
    }

    // 1. Validar rol del solicitante
    if (adminRequesterId) {
      try {
        const profileRes = await fetch(
          `${supabaseUrl}/rest/v1/profiles?id=eq.${adminRequesterId}&select=role`,
          {
            headers: {
              apikey: serviceRoleKey,
              Authorization: `Bearer ${serviceRoleKey}`,
            },
          }
        );
        if (profileRes.ok) {
          const profiles = (await profileRes.json()) as any[];
          const requesterRole = profiles?.[0]?.role;
          if (requesterRole && !['superadmin', 'admin'].includes(requesterRole)) {
            return res.status(403).json({ error: 'No autorizado para resetear credenciales.' });
          }
        }
      } catch (checkErr) {
        console.warn('Aviso validando rol del solicitante:', checkErr);
      }
    }

    // 2. Actualización efectiva en Supabase Auth
    const authAdminUrl = `${supabaseUrl}/auth/v1/admin/users/${userId}`;
    const updateRes = await fetch(authAdminUrl, {
      method: 'PUT',
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        password: newPassword,
        email_confirm: true,
      }),
    });

    if (!updateRes.ok) {
      const errData = ((await updateRes.json().catch(() => ({}))) || {}) as any;
      return res.status(updateRes.status).json({
        error:
          errData.msg ||
          errData.message ||
          'Error al actualizar credencial en Supabase Auth.',
      });
    }

    // 3. Registrar auditoría
    try {
      await fetch(`${supabaseUrl}/rest/v1/security_audit_logs`, {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          user_id: userId,
          user_email: userEmail || 'usuario@sistema.gov',
          user_name: userName || 'Usuario',
          event_type: 'PASSWORD_RESET_PROVISIONAL',
          severity: 'WARNING',
          action_detail: `Contraseña provisional asignada por el administrador ID: ${adminRequesterId || 'admin'}`,
        }),
      });
    } catch (auditErr) {
      console.warn('Aviso registrando auditoría:', auditErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Contraseña actualizada y habilitada para login.',
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Error interno del servidor.' });
  }
}
