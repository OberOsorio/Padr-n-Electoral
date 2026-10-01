import React from 'react';
import { Power, X, Loader2, ShieldAlert, KeyRound } from 'lucide-react';

export interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  title?: string;
  description?: string;
  userName?: string;
  userEmail?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  variant?: 'danger' | 'success' | 'info';
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  title = '¿Confirmar acción?',
  description = 'Esta operación modificará los permisos del usuario en la plataforma.',
  userName,
  userEmail,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = true,
  variant,
}) => {
  if (!isOpen) return null;

  const effectiveVariant = variant || (isDestructive ? 'danger' : 'success');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        e.stopPropagation();
        if (!loading) onClose();
      }}
    >
      <div
        className="relative w-full max-w-md bg-[#090f1d] border border-[#1d2c4d] rounded-[28px] shadow-2xl shadow-black/90 p-6 sm:p-7 overflow-hidden animate-in zoom-in-95 duration-200 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Resplandor decorativo de fondo */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none ${
            effectiveVariant === 'danger'
              ? 'bg-rose-600/15'
              : effectiveVariant === 'info'
              ? 'bg-sky-600/15'
              : 'bg-emerald-600/15'
          }`}
        />

        {/* Botón cerrar X */}
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icono Principal */}
        <div className="relative inline-flex items-center justify-center mb-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${
              effectiveVariant === 'danger'
                ? 'bg-rose-500/10 border-rose-500/25 text-rose-400 shadow-lg shadow-rose-500/10'
                : effectiveVariant === 'info'
                ? 'bg-sky-500/10 border-sky-500/25 text-sky-400 shadow-lg shadow-sky-500/10'
                : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-lg shadow-emerald-500/10'
            }`}
          >
            {effectiveVariant === 'danger' ? (
              <Power className="w-6 h-6 animate-pulse" />
            ) : effectiveVariant === 'info' ? (
              <KeyRound className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>
        </div>

        {/* Título y Mensaje */}
        <h3 className="text-lg font-bold text-white tracking-tight mb-2">
          {title}
        </h3>

        <p className="text-xs text-slate-400 leading-relaxed mb-5">
          {description}
        </p>

        {/* Caja de contexto del usuario */}
        {userName && (
          <div className="mb-6 p-3 rounded-2xl bg-[#060a14] border border-[#16223e] flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-slate-100 block truncate">
                {userName}
              </span>
              {userEmail && (
                <span className="text-[11px] font-mono text-slate-400 block truncate">
                  {userEmail}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-700/60 bg-[#0e1628] hover:bg-[#14203a] text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-3 px-4 rounded-xl text-white text-xs font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
              effectiveVariant === 'danger'
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                : effectiveVariant === 'info'
                ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
            } disabled:opacity-50`}
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{loading ? 'Procesando...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
