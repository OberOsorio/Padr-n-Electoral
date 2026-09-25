import { useState } from 'react';
import type { AppRole } from '../../../types';
import {
  X,
  UserPlus,
  Mail,
  Lock,
  User,
  Shield,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    full_name: string;
    email: string;
    password?: string;
    role: AppRole;
  }) => Promise<boolean>;
}

export const CreateMemberModal = ({
  isOpen,
  onClose,
  onCreate,
}: CreateMemberModalProps) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Electoral2026*');
  const [role, setRole] = useState<AppRole>('coordinador');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError('Por favor complete el nombre y correo electrónico.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await onCreate({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role,
      });

      if (success) {
        setFullName('');
        setEmail('');
        setPassword('Electoral2026*');
        setRole('coordinador');
        onClose();
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Error inesperado al crear el miembro.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-2xl p-6 md:p-8 overflow-hidden transition-colors">
        {/* Línea de realce superior */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* Encabezado */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-700/60 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Nuevo Miembro del Equipo
              </h3>
              <p className="text-[11px] font-mono text-amber-600 dark:text-[#E5B869] font-medium">
                Aprovisionamiento de Acceso
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
          <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-xs text-rose-800 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre Completo */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
              Nombre Completo <span className="text-blue-600 dark:text-blue-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Roberto Gómez Bolaños"
                className="w-full h-10 pl-10 pr-3.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Correo Electrónico */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
              Correo Institucional <span className="text-blue-600 dark:text-blue-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-400 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coordinador@electoral.gov"
                className="w-full h-10 pl-10 pr-3.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Contraseña Provisional */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
              Contraseña Provisional <span className="text-blue-600 dark:text-blue-400">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 pl-10 pr-3.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Rol del Miembro */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
              Rol Asignado
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRole('lider')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  role === 'lider'
                    ? 'bg-cyan-50 dark:bg-cyan-600/20 border-cyan-500 text-cyan-900 dark:text-white ring-1 ring-cyan-500'
                    : 'bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">Líder</span>
                  {role === 'lider' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Enrolamiento en terreno
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRole('coordinador')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  role === 'coordinador'
                    ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-500 text-blue-900 dark:text-white ring-1 ring-blue-500'
                    : 'bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">Coordinador</span>
                  {role === 'coordinador' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Gestión de zona / puesto
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'bg-amber-50 dark:bg-[#E5B869]/20 border-amber-500 dark:border-[#E5B869]/60 text-amber-900 dark:text-white ring-1 ring-amber-500'
                    : 'bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-amber-600 dark:text-[#E5B869]">Admin</span>
                  {role === 'admin' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 dark:text-[#E5B869]" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Control total de campaña
                </p>
              </button>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-700/60 text-xs font-mono text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Shield className="w-3.5 h-3.5" />
              )}
              <span>Crear Acceso</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
