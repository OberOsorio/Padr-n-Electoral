import { useState, useRef, useEffect } from 'react';
import { LogOut, Mail, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { SignOutModal } from '../common/SignOutModal';

export interface UserProfileCardProps {
  name?: string;
  userName?: string;
  email?: string;
  userEmail?: string;
  role?: string;
  userRole?: string;
  isCollapsed?: boolean;
  onLogout?: () => void;
  onSignOut?: () => void;
  className?: string;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  name,
  userName = 'ALEJANDRO DORIA',
  email,
  userEmail = 'alejo.doria@ejemplo.com',
  role,
  userRole = 'ADMIN',
  isCollapsed = false,
  onLogout,
  onSignOut,
  className = '',
}) => {
  const effectiveName = name || userName;
  const effectiveEmail = email || userEmail;
  const effectiveRole = (role || userRole).toUpperCase();
  const effectiveLogout = onLogout || onSignOut;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Obtener iniciales del usuario (máximo 2 caracteres)
  const initials =
    effectiveName
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
      if (effectiveLogout) {
        effectiveLogout();
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
          title={`${effectiveName} (${effectiveRole})`}
          aria-label="Opciones de perfil de usuario"
          aria-expanded={isMenuOpen}
        >
          {/* Avatar con degradado y punto de estado */}
          <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 border border-blue-400/40 flex items-center justify-center text-white font-black text-xs tracking-wider shadow-[0_0_15px_rgba(37,99,235,0.4)] select-none group-hover:scale-105 transition-transform">
            <span>{initials}</span>

            {/* Indicador de sesión activa en la esquina inferior derecha con LED pulsante */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0C152B] flex items-center justify-center shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </span>
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
              className="absolute left-full ml-3.5 bottom-0 w-64 rounded-2xl bg-white/95 dark:bg-[#0C152B]/95 backdrop-blur-xl border border-slate-200 dark:border-blue-500/20 shadow-2xl p-3 z-50 select-none"
            >
              {/* Cabecera del popover */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 border border-blue-400/40 flex items-center justify-center text-white font-black text-xs tracking-wider shadow-sm shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {effectiveName}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">{effectiveEmail}</span>
                  </p>
                </div>
              </div>

              {/* Fila de Rol y Estatus */}
              <div className="flex items-center justify-between py-2.5 px-1 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Shield className="w-3.5 h-3.5 text-blue-500" />
                  <span>Rol asignado:</span>
                </div>
                <span className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase">
                  {effectiveRole}
                </span>
              </div>

              {/* Botón de acción: Cerrar Sesión */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setShowSignOutModal(true);
                }}
                className="w-full mt-1 py-2 px-3 rounded-xl bg-white/[0.03] hover:bg-rose-500/10 border border-slate-200 dark:border-white/5 hover:border-rose-500/30 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar sesión</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Profesional de Confirmación de Cierre */}
        <SignOutModal
          isOpen={showSignOutModal}
          onClose={() => setShowSignOutModal(false)}
          onConfirm={handleSignOut}
          userName={effectiveName}
          userEmail={effectiveEmail}
          userRole={effectiveRole}
        />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // MODO EXPANDIDO (Premium User Profile Card)
  // --------------------------------------------------------------------------
  return (
    <div
      className={`w-full max-w-[280px] p-3.5 rounded-2xl bg-white/90 dark:bg-[#0C152B]/90 border border-slate-200 dark:border-blue-500/20 backdrop-blur-xl shadow-sm dark:shadow-[0_10px_25px_rgba(0,0,0,0.45)] flex flex-col gap-3 transition-all select-none ${className}`}
    >
      {/* 1. Información del Usuario */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Avatar con gradiente y LED pulsante */}
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 border border-blue-400/40 text-white font-black text-sm flex items-center justify-center shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            {initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0C152B] flex items-center justify-center shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          </span>
        </div>

        {/* Nombre y Rol */}
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
            {effectiveName}
          </div>
          <div className="mt-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-[10px] font-bold text-amber-700 dark:text-amber-400">
              <Shield className="w-2.5 h-2.5" />
              {effectiveRole}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Botón Cerrar Sesión en la parte inferior */}
      <button
        type="button"
        onClick={() => setShowSignOutModal(true)}
        className="w-full py-2 px-3 rounded-xl bg-slate-100/80 hover:bg-rose-50 dark:bg-white/[0.03] dark:hover:bg-rose-500/10 border border-slate-200 hover:border-rose-300 dark:border-white/5 dark:hover:border-rose-500/30 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] group cursor-pointer"
      >
        <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        <span>Cerrar sesión</span>
      </button>

      {/* Modal Profesional de Confirmación de Cierre */}
      <SignOutModal
        isOpen={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={handleSignOut}
        userName={effectiveName}
        userEmail={effectiveEmail}
        userRole={effectiveRole}
      />
    </div>
  );
};

export const PremiumUserProfile = UserProfileCard;
export default UserProfileCard;
