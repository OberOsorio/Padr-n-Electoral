import React from 'react';
import { createPortal } from 'react-dom';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type AlertType = 'error' | 'warning' | 'success' | 'info';

export interface PremiumAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: AlertType;
  buttonText?: string;
}

export const PremiumAlertModal: React.FC<PremiumAlertModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'error',
  buttonText = 'Entendido',
}) => {
  if (typeof document === 'undefined') return null;

  // Esquemas visuales temáticos
  const config = {
    error: {
      defaultTitle: 'Error en la Operación',
      icon: ShieldAlert,
      iconColor: 'text-rose-500 dark:text-rose-400',
      iconBg: 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/25',
      glow: 'bg-rose-500/20 dark:bg-rose-500/15',
      button: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-rose-500/25 text-white',
      badge: 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400',
      badgeText: 'ALERTA DEL SISTEMA',
    },
    warning: {
      defaultTitle: 'Atención Requerida',
      icon: AlertTriangle,
      iconColor: 'text-amber-500 dark:text-amber-400',
      iconBg: 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/25',
      glow: 'bg-amber-500/20 dark:bg-amber-500/15',
      button: 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-amber-500/25 text-white',
      badge: 'border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400',
      badgeText: 'VALIDACIÓN',
    },
    success: {
      defaultTitle: 'Operación Exitosa',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      iconBg: 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/25',
      glow: 'bg-emerald-500/20 dark:bg-emerald-500/15',
      button: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/25 text-white',
      badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      badgeText: 'CONFIRMADO',
    },
    info: {
      defaultTitle: 'Información',
      icon: Info,
      iconColor: 'text-indigo-500 dark:text-indigo-400',
      iconBg: 'bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500/25',
      glow: 'bg-indigo-500/20 dark:bg-indigo-500/15',
      button: 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-500/25 text-white',
      badge: 'border-indigo-500/20 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      badgeText: 'AVISO',
    },
  }[type];

  const IconComponent = config.icon;
  const displayTitle = title || config.defaultTitle;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="premium-alert-title"
        >
          {/* Backdrop con micro-desenfoque */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md cursor-pointer"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md rounded-[28px] bg-white dark:bg-[#0c1220] border border-slate-200/90 dark:border-slate-800/80 p-6 sm:p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl overflow-hidden z-10 text-slate-800 dark:text-slate-100"
          >
            {/* Resplandor ambiental de color según el tipo */}
            <div
              className={`absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-28 rounded-full ${config.glow} blur-3xl pointer-events-none`}
              aria-hidden="true"
            />

            {/* Botón de cierre discreto (X) */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Contenido Superior */}
            <div className="flex flex-col items-center text-center">
              {/* Badge superior */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold tracking-wider uppercase mb-5 ${config.badge}`}
              >
                <Sparkles className="w-3 h-3" />
                <span>{config.badgeText}</span>
              </div>

              {/* Icono central iluminado */}
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-inner mb-4 transition-transform ${config.iconBg}`}
              >
                <IconComponent className={`w-8 h-8 ${config.iconColor}`} />
              </div>

              {/* Título */}
              <h3
                id="premium-alert-title"
                className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2"
              >
                {displayTitle}
              </h3>

              {/* Mensaje descriptivo */}
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mb-6">
                {message}
              </p>

              {/* Botón de acción Premium */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={onClose}
                className={`w-full py-3.5 px-6 rounded-2xl font-semibold text-sm tracking-wide shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${config.button}`}
              >
                <span>{buttonText}</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
