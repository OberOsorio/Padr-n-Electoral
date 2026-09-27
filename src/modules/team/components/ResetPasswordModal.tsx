import { useState } from 'react';
import type { TeamMember } from '../../../types';
import {
  X,
  KeyRound,
  Check,
  Lock,
  Mail,
  Shield,
  Loader2,
  Share2,
} from 'lucide-react';

interface ResetPasswordModalProps {
  isOpen: boolean;
  member: TeamMember | null;
  onClose: () => void;
  onResetPassword: (email: string, temporaryPassword?: string) => Promise<{ success: boolean; message: string }>;
}

export const ResetPasswordModal = ({
  isOpen,
  member,
  onClose,
  onResetPassword,
}: ResetPasswordModalProps) => {
  const [temporaryPassword, setTemporaryPassword] = useState('Electoral2026*');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !member) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://electoral.gov';
  const shareMessage = `Hola ${member.full_name}, tus credenciales de acceso para el Padrón Electoral son:
📧 Correo: ${member.email}
🔑 Clave provisional: ${temporaryPassword}
🌐 Enlace: ${appUrl}

Por seguridad, te recomendamos cambiar la contraseña al iniciar sesión.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await onResetPassword(member.email, temporaryPassword);
      setSuccessMessage(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al resetear contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-2xl p-6 md:p-8 overflow-hidden transition-colors">
        {/* Línea superior */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

        {/* Encabezado */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700/60 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-[#E5B869]">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Resetear Contraseña de Acceso
              </h3>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Credencial de campaña para {member.full_name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-xs text-rose-800 dark:text-rose-300">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleReset} className="space-y-4">
          {/* Datos del Miembro */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-900 dark:text-white">{member.full_name}</span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 font-medium">
                {member.role}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <Mail className="w-3.5 h-3.5" />
              <span>{member.email}</span>
            </div>
          </div>

          {/* Nueva Contraseña Inicial / Provisional */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
              Contraseña Provisional Sugerida
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                value={temporaryPassword}
                onChange={(e) => setTemporaryPassword(e.target.value)}
                className="w-full h-10 pl-10 pr-3.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              El usuario podrá utilizar esta clave o el enlace de recuperación enviado a su bandeja.
            </p>
          </div>

          {/* Botón rápido para copiar plantilla de WhatsApp */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleCopy}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/60 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600/70 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    ¡Credenciales copiadas al portapapeles!
                  </span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Copiar credenciales para enviar por WhatsApp</span>
                </>
              )}
            </button>
          </div>

          {/* Acciones */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-700/60 text-xs font-mono text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Cerrar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-md shadow-amber-600/20"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Shield className="w-3.5 h-3.5" />
              )}
              <span>Confirmar Reseteo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
