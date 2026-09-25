import React, { useState, useRef, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MasterUserCardProps {
  name?: string;
  email?: string;
  roleLabel?: string;
  onSignOut?: () => void;
  collapsed?: boolean;
}

export const MasterUserCard: React.FC<MasterUserCardProps> = ({
  name = 'SuperAdmin',
  email = 'superadmin@saas.gov',
  roleLabel = 'MASTER',
  onSignOut,
  collapsed = false,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cierre de dropdown al hacer clic fuera (en modo colapsado)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Si está en modo colapsado (Mini Rail)
  if (collapsed) {
    return (
      <div className="relative flex justify-center" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="h-9 w-9 rounded-lg relative flex-shrink-0 cursor-pointer group focus:outline-none"
          title={`${name} (${email})`}
          aria-label="Perfil SuperAdmin"
        >
          {/* Avatar con gradiente amatista / índigo */}
          <div className="h-full w-full rounded-lg bg-gradient-to-tr from-purple-700 via-indigo-600 to-violet-500 shadow-inner ring-1 ring-white/10 flex items-center justify-center transition-transform group-hover:scale-105">
            <span className="text-xs font-bold text-white tracking-wider">SA</span>
          </div>

          {/* Halo de conexión online */}
          <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping opacity-75 absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-slate-950" />
          </span>
        </button>

        {/* Dropdown flotante en modo colapsado */}
        <AnimatePresence>
          {dropdownOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 10 }}
              transition={{ duration: 0.15 }}
              className="absolute left-full ml-3 bottom-0 w-60 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-3 z-50 text-left"
            >
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-700 via-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  SA
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {name}
                    </p>
                    <span className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 px-1 py-0.2 rounded text-[8px] font-mono font-bold tracking-wider uppercase">
                      {roleLabel}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{email}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  if (onSignOut) onSignOut();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar sesión</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Modo expandido estándar
  return (
    <div className="w-full bg-white hover:bg-slate-50 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-purple-500/30 rounded-xl p-2.5 sm:p-3 shadow-xs transition-all duration-200 flex items-center justify-between gap-3 group">
      {/* Avatar de SuperAdmin con Halo de Estado */}
      <div className="h-9 w-9 rounded-lg relative flex-shrink-0">
        <div className="h-full w-full rounded-lg bg-gradient-to-tr from-purple-700 via-indigo-600 to-violet-500 shadow-inner ring-1 ring-white/10 flex items-center justify-center">
          <span className="text-xs font-bold text-white tracking-wider">SA</span>
        </div>

        {/* Indicador de conexión online con halo pulsante */}
        <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
          <span className="animate-ping opacity-75 absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-slate-950" />
        </span>
      </div>

      {/* Bloque de Datos del Operador Maestro */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate tracking-tight">
            {name}
          </span>
          <span className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase inline-block">
            {roleLabel}
          </span>
        </div>
        <span
          className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate block mt-0.5 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          title={email}
        >
          {email}
        </span>
      </div>

      {/* Botón de Desconexión Táctil */}
      <button
        type="button"
        onClick={onSignOut}
        title="Cerrar sesión de SuperAdmin"
        aria-label="Cerrar sesión de SuperAdmin"
        className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 active:scale-95 transition-all duration-150 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 cursor-pointer"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
