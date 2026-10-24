import React, { useState, useEffect } from 'react';
import type { AppRole, UserPermissions, TeamMember } from '../../../types';
import {
  X,
  Pencil,
  Mail,
  User,
  Loader2,
  CheckCircle2,
  Target,
} from 'lucide-react';

interface EditMemberModalProps {
  isOpen: boolean;
  member: TeamMember | null;
  onClose: () => void;
  onUpdate: (
    id: string,
    data: {
      full_name: string;
      role: AppRole;
      meta_electores: number;
      permissions?: UserPermissions;
    }
  ) => Promise<boolean>;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  member,
  onClose,
  onUpdate,
}) => {
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'lider' | 'coordinador'>('coordinador');
  const [metaElectoresInput, setMetaElectoresInput] = useState<string | number>(member?.meta_electores ?? 100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar valores iniciales del miembro seleccionado
  useEffect(() => {
    if (member) {
      setFullName(member.full_name || '');
      const assignedRole = member.role === 'lider' ? 'lider' : 'coordinador';
      setRole(assignedRole);
      setMetaElectoresInput(member.meta_electores && member.meta_electores > 0 ? member.meta_electores : 100);
      setError(null);
    }
  }, [member, isOpen]);

  // Manejador de cambio fluido (permite campo vacío o solo dígitos)
  const handleMetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^[0-9\b]+$/.test(val)) {
      setMetaElectoresInput(val);
    }
  };

  // Validación al desenfocar (onBlur)
  const handleMetaBlur = () => {
    if (metaElectoresInput === '' || Number(metaElectoresInput) < 1) {
      setMetaElectoresInput(1);
    } else {
      setMetaElectoresInput(Number(metaElectoresInput));
    }
  };

  // Manejador de botones de preajuste
  const handlePresetClick = (valor: number) => {
    setMetaElectoresInput(valor);
  };

  if (!isOpen || !member) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('El nombre completo es requerido.');
      return;
    }

    const finalMeta = Number(metaElectoresInput) > 0 ? Number(metaElectoresInput) : 100;

    setLoading(true);
    setError(null);

    try {
      const ok = await onUpdate(member.id, {
        full_name: fullName.trim(),
        role: role as AppRole,
        meta_electores: finalMeta,
      });

      if (ok) {
        onClose();
      } else {
        setError('No se pudo guardar la información del colaborador.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado al guardar cambios.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] rounded-2xl p-6 sm:p-7 shadow-2xl overflow-hidden transition-all my-auto max-h-[95vh] flex flex-col text-slate-800 dark:text-zinc-100">
        {/* Cabecera (Header) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/[0.07] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Editar Colaborador
              </h3>
              <p className="text-xs font-mono text-slate-500 dark:text-zinc-400 mt-0.5">
                Actualización de datos y cuota de electores
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-800 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="mt-5 flex-1 overflow-y-auto pr-1 space-y-4">
          {/* Campo 1: Nombre Completo */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-semibold">
              Nombre Completo <span className="text-blue-600 dark:text-blue-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Roberto Gómez Bolaños"
                className="w-full h-10.5 pl-10 pr-3.5 bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Campo 2: Correo Registrado (Solo Lectura) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-semibold">
                Correo Registrado
              </label>
              <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                Identificador de cuenta
              </span>
            </div>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="email"
                disabled
                value={member.email || 'Sin correo registrado'}
                className="w-full h-10.5 pl-10 pr-3.5 bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] rounded-xl text-xs font-mono text-slate-500 dark:text-zinc-400 cursor-not-allowed select-none"
              />
            </div>
          </div>

          {/* Campo 3: Rol Asignado */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-semibold">
              Rol Asignado
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Tarjeta Coordinador */}
              <div
                onClick={() => setRole('coordinador')}
                className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer select-none ${
                  role === 'coordinador'
                    ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-400 dark:border-blue-500/40 ring-1 ring-blue-500/30 shadow-xs'
                    : 'bg-slate-50/50 dark:bg-[#18181b] border-slate-200 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.14]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                      Coordinador
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">
                      Gestión
                    </span>
                  </div>
                  {role === 'coordinador' && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-snug">
                  Supervisión de puesto, auditoría y reportes.
                </p>
              </div>

              {/* Tarjeta Líder */}
              <div
                onClick={() => setRole('lider')}
                className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer select-none ${
                  role === 'lider'
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-400 dark:border-emerald-500/40 ring-1 ring-emerald-500/30 shadow-xs'
                    : 'bg-slate-50/50 dark:bg-[#18181b] border-slate-200 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.14]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Líder
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                      Terreno
                    </span>
                  </div>
                  {role === 'lider' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-snug">
                  Enrolamiento y captura directa de votantes.
                </p>
              </div>
            </div>
          </div>

          {/* Campo 4: Meta de Electores (Cuota Operativa) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-zinc-400 font-semibold">
                Meta de Electores (Cuota) <span className="text-blue-600 dark:text-blue-400">*</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                No bloqueante
              </span>
            </div>

            <div className="relative">
              <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="text"
                inputMode="numeric"
                required
                value={metaElectoresInput}
                onChange={handleMetaChange}
                onBlur={handleMetaBlur}
                placeholder="100"
                className="w-full h-10.5 pl-10 pr-3.5 bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-mono font-bold tabular-nums text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Botones Presets Rápidos */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 mr-1">Preajuste:</span>
              {[50, 100, 200, 500].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePresetClick(val)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold tabular-nums transition-all cursor-pointer border active:scale-[0.96] ${
                    Number(metaElectoresInput) === val
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white dark:bg-[#18181b] text-slate-600 dark:text-zinc-300 border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14]'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-zinc-500 leading-tight">
              Ajustable en cualquier momento. No altera los electores ya inscritos ({member.totalElectores || 0} registrados).
            </p>
          </div>

          {/* Botonera Inferior (Footer) */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/[0.07] shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-[#18181b] dark:hover:bg-white/[0.06] transition-colors cursor-pointer active:scale-[0.98]"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 flex items-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
