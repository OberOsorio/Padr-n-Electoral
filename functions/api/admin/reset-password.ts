// Cloudflare Pages Function: /api/admin/reset-password
// Endpoint administrativo seguro para asignar contraseña provisional en Supabase Auth

interface Env {
  SUPABASE_URL?: string;
  VITE_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  VITE_SUPABASE_SERVICE_ROLE_KEY?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  try {
    const body = (await request.json().catch(() => ({}))) as any;
    const { userId, newPassword, adminRequesterId, userEmail, userName } = body || {};

    if (!userId || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros requeridos (userId, newPassword).' }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabaseUrl =
      env.SUPABASE_URL || env.VITE_SUPABASE_URL || 'https://gwerezjurmxuwcqousqg.supabase.co';
    const serviceRoleKey =
      env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'SUPABASE_SERVICE_ROLE_KEY no configurado en el servidor.' }),
        { status: 500, headers: corsHeaders }
      );
    }

    // 1. Validar que quien solicita sea admin o superadmin (si se envía adminRequesterId)
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
            return new Response(
              JSON.stringify({ error: 'No autorizado para resetear credenciales.' }),
              { status: 403, headers: corsHeaders }
            );
          }
        }
      } catch (checkErr) {
        console.warn('Aviso validando rol del solicitante:', checkErr);
      }
    }

    // 2. Actualización efectiva de la contraseña en auth.users vía Auth Admin API
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
      return new Response(
        JSON.stringify({
          error:
            errData.msg ||
            errData.message ||
            'Error al actualizar credencial en Supabase Auth.',
        }),
        { status: updateRes.status, headers: corsHeaders }
      );
    }

    // 3. Registrar el evento en el log inmutable de auditoría
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

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contraseña actualizada y habilitada para login.',
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || 'Error interno del servidor.' }),
      { status: 500, headers: corsHeaders }
    );
  }
};

export const onRequestOptions = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
