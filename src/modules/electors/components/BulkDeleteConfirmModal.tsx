import React from 'react';
import type { ElectorWithRegistrant } from '../../../types';
import { AlertTriangle, Trash2, X, Loader2, Users } from 'lucide-react';

interface BulkDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  count: number;
  sampleElectors: ElectorWithRegistrant[];
  deleting: boolean;
}

export const BulkDeleteConfirmModal: React.FC<BulkDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count,
  sampleElectors,
  deleting,
}) => {
  if (!isOpen || count === 0) return null;

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
          ¿Eliminar {count} {count === 1 ? 'elector seleccionado' : 'electores seleccionados'}?
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 leading-relaxed">
          Esta acción eliminará de forma <strong className="text-rose-600 dark:text-rose-400">permanente y definitiva</strong> a los {count} registros seleccionados de la base de datos de Supabase. El conteo de la campaña y los puestos se actualizarán automáticamente.
        </p>

        {/* Muestra de electores a eliminar */}
        <div className="my-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs font-mono max-h-36 overflow-y-auto scrollbar-thin">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-200 dark:border-slate-800">
            <Users className="w-3.5 h-3.5" />
            <span>Muestra de registros a eliminar ({sampleElectors.length} de {count}):</span>
          </div>
          {sampleElectors.slice(0, 5).map((e) => (
            <div key={e.id} className="flex items-center justify-between text-[11px] py-0.5">
              <span className="text-slate-800 dark:text-slate-200 truncate font-semibold">
                {e.nombres} {e.apellidos}
              </span>
              <span className="text-slate-500 dark:text-slate-400 shrink-0 font-mono ml-2">
                CC: {e.cedula}
              </span>
            </div>
          ))}
          {count > 5 && (
            <p className="text-[10px] text-slate-400 italic pt-1 text-center">
              ... y {count - 5} electores más seleccionados.
            </p>
          )}
        </div>

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
            onClick={onConfirm}
            disabled={deleting}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-rose-900/20"
          >
            {deleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>Eliminar {count} {count === 1 ? 'Elector' : 'Electores'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
