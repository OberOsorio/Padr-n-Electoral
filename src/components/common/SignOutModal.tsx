import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { LogOut, X, Loader2 } from 'lucide-react';
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
  userName,
  userEmail,
}) => {
  const [loading, setLoading] = useState(false);

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

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signout-modal-title"
        >
          {/* Backdrop con micro-desenfoque sobre toda la pantalla */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            onClick={loading ? undefined : onClose}
            aria-hidden="true"
          />

          {/* Tarjeta Ejecutiva del Modal Centrado en Pantalla */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl backdrop-blur-xl overflow-hidden z-10"
          >
            {/* Micro-resplandor superior centrado */}
            <div
              className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-16 bg-slate-200/50 dark:bg-slate-800/40 blur-2xl pointer-events-none"
              aria-hidden="true"
            />

            {/* Botón de cierre discreto (X) */}
            {!loading && (
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* Contenido Central */}
            <div className="relative flex flex-col items-center text-center">
              {/* Icono Superior Elegante y Compacto */}
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 dark:bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-500 dark:text-rose-400">
                <LogOut className="w-5 h-5" strokeWidth={1.75} />
              </div>

              {/* Título Ejecutivo */}
              <h3
                id="signout-modal-title"
                className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight"
              >
                ¿Cerrar sesión activa?
              </h3>

              {/* Descripción */}
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2 px-2">
                Se desconectará de forma segura. Tendrá que ingresar sus credenciales nuevamente para acceder a la plataforma.
              </p>

              {/* Identificador discreto de cuenta */}
              {(userEmail || userName) && (
                <div className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/40 text-[11px] text-slate-600 dark:text-slate-300 font-mono max-w-[260px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">{userEmail || userName}</span>
                </div>
              )}

              {/* Botonera de Acción en 2 Columnas */}
              <div className="flex items-center gap-3 mt-6 pt-2 w-full">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/70 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-center cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] shadow-sm shadow-rose-950 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Cerrando...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                      <span>Cerrar Sesión</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export const LogoutModal = SignOutModal;
