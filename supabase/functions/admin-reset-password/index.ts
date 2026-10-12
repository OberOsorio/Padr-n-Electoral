// supabase/functions/admin-reset-password/index.ts
// Función administrativa segura para Supabase Edge Runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, newPassword, adminRequesterId, userEmail, userName } = await req.json();

    if (!userId || !newPassword) {
      return new Response(
        JSON.stringify({ error: 'Faltan parámetros requeridos (userId, newPassword).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 1. Validar que quien solicita sea superadmin o admin (si se envió requester)
    if (adminRequesterId) {
      const { data: requesterProfile, error: profileErr } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', adminRequesterId)
        .single();

      if (profileErr || !['superadmin', 'admin'].includes(requesterProfile?.role)) {
        return new Response(
          JSON.stringify({ error: 'No autorizado para resetear credenciales.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 2. ACTUALIZACIÓN EFECTIVA DE LA CONTRASEÑA EN AUTH.USERS
    const { data: updatedUser, error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        password: newPassword,
        email_confirm: true, // Asegura que el email esté validado para inicio de sesión inmediato
      }
    );

    if (updateErr) {
      throw updateErr;
    }

    // 3. Registrar el evento en el log inmutable de seguridad
    try {
      await supabaseAdmin.from('security_audit_logs').insert({
        user_id: userId,
        user_email: userEmail || updatedUser?.user?.email || 'usuario@sistema.gov',
        user_name: userName || 'Usuario',
        event_type: 'PASSWORD_RESET_PROVISIONAL',
        severity: 'WARNING',
        action_detail: `Contraseña provisional asignada por el administrador ID: ${adminRequesterId || 'admin'}`,
      });
    } catch (auditErr) {
      console.warn('[Admin Reset Password] Aviso al registrar auditoría:', auditErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Contraseña actualizada y habilitada para login.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[Admin Reset Password] Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Error interno del servidor.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
