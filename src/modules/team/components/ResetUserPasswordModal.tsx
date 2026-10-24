import React, { useState } from 'react';
import { Key, CheckCircle2, Copy, Shield, X, Loader2, Check } from 'lucide-react';
import { supabase } from '../../../services/supabase';
import { supabaseAdmin } from '../../../lib/supabaseAdmin';

export interface ResetPasswordModalProps {
  user?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  } | null;
  member?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onResetPassword?: (email: string, temporaryPassword?: string, userId?: string) => Promise<{ success: boolean; message: string }>;
}

export const ResetUserPasswordModal: React.FC<ResetPasswordModalProps> = ({
  user,
  member,
  isOpen,
  onClose,
  onResetPassword: _onResetPassword,
}) => {
  const targetUser = user || member;
  const [claveProvisional, setClaveProvisional] = useState('Electoral2026*');
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  if (!isOpen || !targetUser) return null;

  const handleConfirmarReseteo = async () => {
    setLoading(true);
    setErrorMsg(null);
    setExito(false);

    try {
      // 1. Obtener la sesión del administrador autenticado
      const { data: { user: currentAdmin } } = await supabase.auth.getUser();
      const adminRequesterId = currentAdmin?.id;

      let applied = false;
      let lastErrorMessage = '';

      // 2. Invocar endpoint administrativo seguro en el servidor (/api/admin/reset-password)
      try {
        const response = await fetch('/api/admin/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: targetUser.id,
            newPassword: claveProvisional,
            adminRequesterId: adminRequesterId,
            userEmail: targetUser.email,
            userName: targetUser.full_name,
          }),
        });

        const result = await response.json().catch(() => ({}));
        if (response.ok && result.success) {
          applied = true;
        } else if (result.error) {
          lastErrorMessage = result.error;
        }
      } catch (fetchErr: unknown) {
        console.warn('Endpoint /api/admin/reset-password no disponible o en red externa, aplicando fallback administrativo:', fetchErr);
      }

      // 3. Fallback directo con supabaseAdmin si el endpoint no estuvo disponible
      if (!applied && supabaseAdmin) {
        try {
          const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
            targetUser.id,
            {
              password: claveProvisional,
              email_confirm: true,
            }
          );

          if (updateErr) {
            throw updateErr;
          }

          // Registrar en auditoría
          try {
            await (supabaseAdmin.from('security_audit_logs') as any).insert({
              user_id: targetUser.id,
              user_email: targetUser.email,
              user_name: targetUser.full_name,
              event_type: 'PASSWORD_RESET_PROVISIONAL',
              severity: 'WARNING',
              action_detail: `Contraseña provisional asignada por el administrador ID: ${adminRequesterId || 'admin'}`,
            });
          } catch {
            // No romper el flujo si el log falla
          }

          applied = true;
        } catch (adminErr: unknown) {
          lastErrorMessage = adminErr instanceof Error ? adminErr.message : 'Error en cliente administrativo';
        }
      }

      if (!applied) {
        throw new Error(lastErrorMessage || 'No se pudo aplicar la contraseña en el motor de autenticación.');
      }

      setExito(true);
    } catch (err: unknown) {
      console.error('Error aplicando reset:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Error al persistir la contraseña en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const copiarWhatsApp = () => {
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://electoral.gov';
    const texto = `Hola ${targetUser.full_name}, tus credenciales de acceso a la plataforma oficial han sido actualizadas:\n\n📧 Correo: ${targetUser.email}\n🔑 Contraseña provisional: ${claveProvisional}\n🌐 Enlace: ${appUrl}\n\nPuedes ingresar y actualizar tu clave desde la plataforma.`;
    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] rounded-2xl w-full max-w-md shadow-2xl p-6 sm:p-7 relative text-slate-800 dark:text-zinc-200">
        
        {/* Cabecera */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              <Key className="w-5 h-5"/>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Resetear Contraseña</h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Credencial de acceso para {targetUser.full_name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4"/>
          </button>
        </div>

        {/* Mensaje de Éxito al Aplicar */}
        {exito && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400"/>
            <span>Acceso reseteado exitosamente para {targetUser.email}. Ya puede iniciar sesión con la clave asignada.</span>
          </div>
        )}

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300 text-xs animate-in fade-in">
            {errorMsg}
          </div>
        )}

        {/* Datos del usuario */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.07] mb-4 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-900 dark:text-white block">{targetUser.full_name}</span>
            <span className="text-[11px] font-mono text-blue-600 dark:text-cyan-400 block">{targetUser.email}</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 uppercase font-mono">
            {targetUser.role.toUpperCase()}
          </span>
        </div>

        {/* Input Clave Provisional */}
        <div className="space-y-1.5 mb-4">
          <label className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider block font-mono">
            Contraseña Provisional Asignada
          </label>
          <input
            type="text"
            value={claveProvisional}
            onChange={(e) => setClaveProvisional(e.target.value)}
            disabled={loading}
            className="w-full bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
          <p className="text-[11px] text-slate-500 dark:text-zinc-500 mt-1">
            Esta contraseña queda inmediatamente habilitada en el sistema para que el usuario pueda autenticarse.
          </p>
        </div>

        {/* Botón WhatsApp */}
        <button
          type="button"
          onClick={copiarWhatsApp}
          className="w-full mb-5 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 hover:bg-slate-100 dark:bg-[#18181b] hover:dark:bg-white/[0.06] text-slate-700 dark:text-zinc-300 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
        >
          {copiado ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"/>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">¡Copiado al portapapeles!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400"/>
              <span>Copiar credenciales para enviar por WhatsApp</span>
            </>
          )}
        </button>

        {/* Botones de Acción */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white hover:bg-slate-50 dark:bg-[#18181b] hover:dark:bg-white/[0.06] text-slate-700 dark:text-zinc-300 text-xs font-semibold transition-all cursor-pointer active:scale-[0.98]"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={handleConfirmarReseteo}
            disabled={loading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Shield className="w-3.5 h-3.5"/>}
            <span>{loading ? 'Aplicando...' : 'Confirmar Reseteo'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
