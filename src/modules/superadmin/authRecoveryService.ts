import { supabase } from '../../lib/supabase';

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

  return { success: true, email, nombreCompleto };
}
