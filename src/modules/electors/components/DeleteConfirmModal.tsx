import { useState } from 'react';
import type { ElectorWithRegistrant } from '../../../types';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  elector: ElectorWithRegistrant | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<boolean>;
}

export const DeleteConfirmModal = ({
  elector,
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !elector) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const success = await onConfirm(elector.id);
      if (success) {
        onClose();
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo eliminar el registro. Verifique sus permisos de administrador.'
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900/50 shadow-2xl p-6 overflow-hidden transition-colors">
        {/* Línea de realce roja superior */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />

        <div className="flex items-start justify-between mb-4">
          <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
          ¿Eliminar Elector del Padrón?
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">
          Esta acción es destructiva e irreversible. El registro será desvinculado del censo electoral y los indicadores en tiempo real se recalcularán automáticamente.
        </p>

        {/* Resumen del elector */}
        <div className="my-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 space-y-1 text-xs font-mono">
          <p className="text-slate-900 dark:text-[#F8FAFC] font-semibold">
            {elector.nombres} {elector.apellidos}
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-[11px]">
            Cédula: <span className="text-slate-800 dark:text-slate-200 font-medium">{elector.cedula}</span>
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-[11px]">
            Puesto: <span className="text-slate-800 dark:text-slate-200 font-medium">{elector.puesto_votacion}</span> (Mesa {elector.mesa})
          </p>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-[11px] text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-700/60 text-xs font-mono text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-rose-900/20"
          >
            {deleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>Eliminar Definitivamente</span>
          </button>
        </div>
      </div>
    </div>
  );
};
