import { useState, useRef, useEffect } from 'react';
import { LogOut, Mail, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { SignOutModal } from '../common/SignOutModal';

export interface UserProfileCardProps {
  userName?: string;
  userEmail?: string;
  userRole?: string;
  isCollapsed?: boolean;
  onSignOut?: () => void;
  className?: string;
}

export const UserProfileCard = ({
  userName = 'Administrador General',
  userEmail = 'admin@electoral.gov',
  userRole = 'Admin',
  isCollapsed = false,
  onSignOut,
  className = '',
}: UserProfileCardProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Obtener iniciales del usuario (máximo 2 caracteres)
  const initials = userName
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'AD';

  // Cerrar popover al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  // Manejador centralizado de cierre de sesión
  const handleSignOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      if (onSignOut) {
        onSignOut();
      } else {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      setIsSigningOut(false);
      setIsMenuOpen(false);
    }
  };

  // --------------------------------------------------------------------------
  // MODO COLAPSADO (Sidebar Mini / Rail)
  // --------------------------------------------------------------------------
  if (isCollapsed) {
    return (
      <div ref={popoverRef} className={`relative flex justify-center ${className}`}>
        {/* Avatar interactivo en modo mini */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="relative group p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
          title={`${userName} (${userRole})`}
          aria-label="Opciones de perfil de usuario"
          aria-expanded={isMenuOpen}
        >
          {/* Avatar con degradado y punto de estado */}
          <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center text-white font-semibold text-xs tracking-wider shadow-md shadow-blue-600/20 ring-1 ring-white/10 dark:ring-white/20 select-none group-hover:scale-105 transition-transform">
            <span>{initials}</span>

            {/* Indicador de sesión activa en la esquina inferior derecha */}
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shadow-xs"
              title="Sesión activa"
            />
          </div>
        </button>

        {/* Popover / Menú Flotante con Framer Motion */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, x: 10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 10 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="absolute left-full ml-3.5 bottom-0 w-64 rounded-2xl bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 shadow-2xl p-3 z-50 select-none"
            >
              {/* Cabecera del popover */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center text-white font-semibold text-xs tracking-wider shadow-sm ring-1 ring-white/20 shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {userName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{userEmail}</span>
                  </p>
                </div>
              </div>

              {/* Fila de Rol y Estatus */}
              <div className="flex items-center justify-between py-2.5 px-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-blue-500" />
                  <span>Rol asignado:</span>
                </div>
                <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide uppercase">
                  {userRole}
                </span>
              </div>

              {/* Botón de acción: Cerrar Sesión */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setShowSignOutModal(true);
                }}
                className="w-full mt-1 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50/80 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200/80 dark:border-rose-800/40 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Cerrar Sesión</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Profesional de Confirmación de Cierre */}
        <SignOutModal
          isOpen={showSignOutModal}
          onClose={() => setShowSignOutModal(false)}
          onConfirm={handleSignOut}
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
        />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // MODO EXPANDIDO (Executive User Card)
  // --------------------------------------------------------------------------
  return (
    <div
      className={`group relative rounded-xl p-2.5 sm:p-3 bg-white/90 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/70 border border-slate-200/90 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600/60 shadow-xs dark:shadow-md backdrop-blur-md flex items-center justify-between gap-3 transition-all duration-200 select-none ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* 1. Avatar con degradado ejecutivo cobalto-índigo */}
        <div className="relative shrink-0">
          <div className="h-9.5 w-9.5 rounded-xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex items-center justify-center text-white font-semibold text-xs tracking-wider shadow-sm ring-1 ring-white/20 dark:ring-white/10">
            <span>{initials}</span>
          </div>

          {/* Indicador de estado: Sesión activa */}
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 shadow-xs"
            title="Sesión activa"
          />
        </div>

        {/* 2. Bloque de Información del Usuario */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight truncate leading-tight">
            {userName}
          </p>

          <div className="flex items-center gap-1.5 mt-1">
            {/* Micro-pill para el rol */}
            <span
              className={`px-1.5 py-0.2 rounded text-[10px] font-medium tracking-wide uppercase shrink-0 leading-normal border ${
                userRole?.toLowerCase() === 'superadmin'
                  ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20'
                  : userRole?.toLowerCase() === 'coordinador'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                  : userRole?.toLowerCase() === 'lider'
                  ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/20'
                  : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
              }`}
            >
              {userRole}
            </span>

            {/* Separador fino */}
            <span className="text-slate-300 dark:text-slate-600 text-[10px] shrink-0">•</span>

            {/* Correo del usuario */}
            <span
              className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[105px] font-mono leading-none"
              title={userEmail}
            >
              {userEmail}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Botón de Acción Profesional: Cerrar Sesión */}
      <button
        type="button"
        onClick={() => setShowSignOutModal(true)}
        className="h-8.5 px-2.5 rounded-xl flex items-center gap-1.5 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 bg-slate-100/70 hover:bg-red-50 dark:bg-slate-800/80 dark:hover:bg-red-950/30 border border-slate-200/80 hover:border-red-300 dark:border-slate-700/60 dark:hover:border-red-500/40 active:scale-95 transition-all duration-150 cursor-pointer text-xs font-semibold shrink-0"
        title="Cerrar sesión de forma segura"
        aria-label="Cerrar sesión"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden sm:inline text-[11px]">Salir</span>
      </button>

      {/* Modal Profesional de Confirmación de Cierre */}
      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleSignOut}
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
      />
    </div>
  );
};
