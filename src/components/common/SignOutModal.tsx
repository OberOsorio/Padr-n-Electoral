import React, { useState } from 'react';
import { LogOut, ShieldAlert, X, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SignOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

export const SignOutModal: React.FC<SignOutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userName = 'Ober Osorio',
  userEmail = 'oberosorio1@gmail.com',
  userRole = 'SuperAdmin',
}) => {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const initials = userName
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SA';

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="signout-modal-title"
      >
        {/* Backdrop click listener */}
        <div
          className="fixed inset-0"
          onClick={loading ? undefined : onClose}
          aria-hidden="true"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-md bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-red-900/30 rounded-3xl shadow-2xl shadow-red-950/20 overflow-hidden z-10"
        >
          {/* Luz ambiental sutil superior */}
          <div
            className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-red-500/10 via-red-500/5 to-transparent pointer-events-none"
            aria-hidden="true"
          />

          {/* Botón de cerrar modal en esquina */}
          {!loading && (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Cancelar y volver"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="relative p-6 sm:p-7 text-center flex flex-col items-center">
            {/* 1. Icono de Alerta de Cierre con Resplandor */}
            <div className="relative mb-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 dark:bg-red-500/15 border border-red-500/30 text-red-500 dark:text-red-400 flex items-center justify-center shadow-[0_0_25px_rgba(239,68,68,0.22)]">
                <LogOut className="w-7 h-7" />
              </div>
            </div>

            {/* Badge de seguridad */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[10px] font-mono font-bold tracking-widest uppercase mb-3">
              <ShieldAlert className="w-3 h-3 text-red-500" />
              <span>Finalizar Sesión Activa</span>
            </div>

            <h3
              id="signout-modal-title"
              className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2"
            >
              ¿Desea cerrar su sesión?
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mb-6">
              Se desconectará de forma segura. Para volver a ingresar a la plataforma deberá autenticarse nuevamente.
            </p>

            {/* Mini tarjeta de perfil del usuario */}
            <div className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-left mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-purple-600/20 shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {userName}
                  </p>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                    {userRole}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate mt-0.5">
                  {userEmail}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>Activo</span>
              </div>
            </div>

            {/* 2. Botones de Acción */}
            <div className="grid grid-cols-2 gap-3 w-full">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-md shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Cerrando...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Cerrar Sesión</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
