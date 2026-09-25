import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import { SignOutModal } from '../common/SignOutModal';

interface MasterUserCardProps {
  name?: string;
  email?: string;
  roleLabel?: string;
  onSignOut?: () => void;
  collapsed?: boolean;
}

export const MasterUserCard: React.FC<MasterUserCardProps> = ({
  name = 'Ober Osorio',
  email = 'oberosorio1@gmail.com',
  roleLabel = 'MASTER',
  onSignOut,
  collapsed = false,
}) => {
  const [showSignOutModal, setShowSignOutModal] = useState(false);

  // Iniciales del usuario
  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'SA';

  const handleConfirmSignOut = async () => {
    if (onSignOut) {
      await onSignOut();
    }
  };

  // Modo colapsado (Mini Rail)
  if (collapsed) {
    return (
      <>
        <div className="relative flex justify-center">
          <button
            type="button"
            onClick={() => setShowSignOutModal(true)}
            className="h-10 w-10 rounded-xl relative flex-shrink-0 cursor-pointer group focus:outline-none"
            title={`Cerrar sesión de ${name} (${email})`}
            aria-label="Cerrar sesión de SuperAdmin"
          >
            {/* Avatar con gradiente amatista / índigo */}
            <div className="h-full w-full rounded-xl bg-gradient-to-tr from-purple-700 via-indigo-600 to-violet-500 shadow-md ring-1 ring-white/10 flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="text-xs font-bold text-white tracking-wider">{initials}</span>
            </div>

            {/* Halo de conexión online */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping opacity-75 absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-slate-950" />
            </span>
          </button>
        </div>

        <SignOutModal
          isOpen={showSignOutModal}
          onClose={() => setShowSignOutModal(false)}
          onConfirm={handleConfirmSignOut}
          userName={name}
          userEmail={email}
          userRole="SuperAdmin Master"
        />
      </>
    );
  }

  // Modo expandido estándar (Executive Card)
  return (
    <>
      <div className="w-full bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-purple-900/30 rounded-2xl p-3 shadow-xs transition-all duration-200 flex items-center justify-between gap-2.5 group">
        {/* Avatar de SuperAdmin con Halo de Estado */}
        <div className="h-9.5 w-9.5 rounded-xl relative flex-shrink-0">
          <div className="h-full w-full rounded-xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 shadow-md shadow-purple-600/20 ring-1 ring-white/10 flex items-center justify-center">
            <span className="text-xs font-bold text-white tracking-wider">{initials}</span>
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
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate tracking-tight">
              {name}
            </span>
            <span className="bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-wider uppercase inline-block">
              {roleLabel}
            </span>
          </div>
          <span
            className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate block mt-0.5"
            title={email}
          >
            {email}
          </span>
        </div>

        {/* Botón Profesional de Cerrar Sesión */}
        <button
          type="button"
          onClick={() => setShowSignOutModal(true)}
          title="Cerrar sesión de forma segura"
          aria-label="Cerrar sesión"
          className="h-8.5 px-2.5 rounded-xl flex items-center gap-1.5 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 bg-slate-100/70 hover:bg-red-50 dark:bg-slate-800/80 dark:hover:bg-red-950/30 border border-slate-200/80 hover:border-red-300 dark:border-slate-700/60 dark:hover:border-red-500/40 active:scale-95 transition-all duration-150 cursor-pointer text-xs font-semibold shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-[11px]">Salir</span>
        </button>
      </div>

      {/* Modal Profesional de Confirmación de Cierre */}
      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleConfirmSignOut}
        userName={name}
        userEmail={email}
        userRole="SuperAdmin Master"
      />
    </>
  );
};
