import {
  LayoutDashboard,
  UserPlus,
  Users,
  UploadCloud,
  ShieldCheck,
  Download,
  Shield,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ArrowLeftRight,
  Globe,
} from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useSidebar } from '../../context/SidebarContext';
import { UserProfileCard } from './UserProfileCard';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export type SidebarTabId =
  | 'dashboard'
  | 'register'
  | 'electors'
  | 'bulk-upload'
  | 'coordinators'
  | 'reports';

interface SidebarProps {
  activeTab: SidebarTabId;
  onSelectTab: (tabId: SidebarTabId) => void;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  onSignOut: () => void;
  onCloseMobile?: () => void;
  onBackToMasterPlatform?: () => void;
  onOpenGateway?: () => void;
  className?: string;
}

interface NavItem {
  id: SidebarTabId;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard General', icon: LayoutDashboard },
  { id: 'register', label: 'Registrar Elector', icon: UserPlus },
  { id: 'electors', label: 'Padrón / Lista de Electores', icon: Users },
  { id: 'bulk-upload', label: 'Carga Masiva', icon: UploadCloud },
  { id: 'coordinators', label: 'Equipo y Accesos', icon: ShieldCheck },
  { id: 'reports', label: 'Exportar Reportes', icon: Download },
];

export const Sidebar = ({
  activeTab,
  onSelectTab,
  userEmail = 'admin@electoral.gov',
  userName = 'Administrador General',
  userRole = 'Admin',
  onSignOut,
  onCloseMobile,
  onBackToMasterPlatform,
  onOpenGateway,
  className,
}: SidebarProps) => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const isOnline = useOnlineStatus();
  const [isModuleMenuOpen, setIsModuleMenuOpen] = useState(false);
  const moduleMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!isModuleMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moduleMenuRef.current && !moduleMenuRef.current.contains(e.target as Node)) {
        setIsModuleMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModuleMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModuleMenuOpen]);

  const isAdmin = userRole ? (userRole.toLowerCase().includes('admin') || userRole.toLowerCase().includes('super')) : true;

  // Ocultar reportes sin conexión y módulo de equipo para roles no administrativos
  const effectiveNavItems = NAV_ITEMS.filter((item) => {
    if (item.id === 'reports' && !isOnline) {
      return false;
    }
    if (item.id === 'coordinators' && !isAdmin) {
      return false;
    }
    return true;
  });

  // En modal móvil nunca se colapsa en mini-rail; siempre se muestra con texto completo
  const isEffectivelyCollapsed = isCollapsed && !onCloseMobile;

  return (
    <motion.aside
      initial={false}
      animate={{
        width: onCloseMobile ? '100%' : isEffectivelyCollapsed ? 80 : 280,
      }}
      transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
      className={`shrink-0 ${
        onCloseMobile
          ? 'h-full bg-white dark:bg-[#09090b]'
          : 'h-screen sticky top-0 bg-white/95 dark:bg-[#121215]/95 md:backdrop-blur-xl'
      } border-r border-slate-200/80 dark:border-white/[0.07] flex flex-col justify-between select-none z-30 transition-colors duration-200 overflow-hidden ${
        className ?? 'hidden md:flex'
      }`}
    >
      {/* 1. Header del Sidebar */}
      <div className={`shrink-0 border-b border-slate-200/80 dark:border-white/[0.07] transition-all ${
        onCloseMobile
          ? 'p-4 pt-[max(1rem,env(safe-area-inset-top))]'
          : isEffectivelyCollapsed
          ? 'p-3 flex flex-col items-center gap-3'
          : 'p-3.5 sm:p-4'
      }`}>
        {isEffectivelyCollapsed ? (
          /* Header en Modo Colapsado / Mini Rail */
          <>
            <div
              onClick={(e) => {
                e.preventDefault();
                window.location.reload();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  window.location.reload();
                }
              }}
              role="button"
              tabIndex={0}
              title="Recargar plataforma"
              aria-label="Recargar plataforma"
              className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-700 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 ring-1 ring-cyan-400/30 hover:ring-cyan-300 hover:shadow-blue-500/40 shrink-0 cursor-pointer select-none active:scale-95 transition-all"
            >
              <Shield className="w-5 h-5 text-white" strokeWidth={2.2} />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white dark:border-[#161F30]"></span>
              </span>
            </div>

            {/* Botón para expandir el panel */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/40 border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer shadow-2xs"
              title="Expandir panel lateral (Ctrl+B)"
              aria-label="Expandir panel lateral"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </>
        ) : (
          /* Header en Modo Expandido */
          <>
            <div className="flex items-center justify-between gap-2.5">
              <div
                onClick={(e) => {
                  e.preventDefault();
                  window.location.reload();
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    window.location.reload();
                  }
                }}
                role="button"
                tabIndex={0}
                title="Recargar plataforma"
                aria-label="Recargar plataforma"
                className="flex items-center gap-3 min-w-0 cursor-pointer select-none group active:scale-[0.98] transition-all"
              >
                <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-700 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 ring-1 ring-cyan-400/30 group-hover:ring-cyan-300 group-hover:shadow-blue-500/40 group-hover:scale-[1.02] transition-all shrink-0">
                  <Shield className="w-5 h-5 text-white" strokeWidth={2.2} />
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white dark:border-[#161F30]"></span>
                  </span>
                </div>

                <div className="min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 leading-none mb-1">
                    <span className="text-[9.5px] font-mono tracking-[0.2em] text-slate-400 dark:text-slate-400 uppercase font-bold">
                      Plataforma Oficial
                    </span>
                  </div>
                  <div className="flex items-center leading-none">
                    <span className="text-[15.5px] font-black tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                      Control<span className="text-cyan-600 dark:text-cyan-400 font-black">Electoral</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Selector de Tema Claro / Oscuro */}
                <ThemeToggle size="sm" />

                {/* Botón de colapso en escritorio */}
                {!onCloseMobile && (
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 transition-all cursor-pointer shadow-2xs active:scale-95"
                    title="Colapsar panel lateral (Ctrl+B)"
                    aria-label="Colapsar panel lateral"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                )}

                {/* Botón de cierre en vista móvil */}
                {onCloseMobile && (
                  <button
                    type="button"
                    onClick={onCloseMobile}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer touch-manipulation active:scale-95"
                    title="Cerrar Menú"
                    aria-label="Cerrar Menú"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2. Menú de Funciones (Scrolleable en caso de pantallas pequeñas) */}
      <div className="flex-1 overflow-y-auto overscroll-contain p-2 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        {!isEffectivelyCollapsed && (
          <p className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Navegación
          </p>
        )}

        <nav className={`space-y-1.5 ${isEffectivelyCollapsed ? 'flex flex-col items-center' : ''}`}>
          {effectiveNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const layoutPrefix = onCloseMobile ? 'mobile-sidebar' : 'desktop-sidebar';

            return (
              <div key={item.id} className="relative group w-full flex justify-center">
                <motion.button
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile?.();
                  }}
                  whileHover={{ x: isEffectivelyCollapsed ? 0 : 4, scale: isEffectivelyCollapsed ? 1.05 : 1 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className={`relative flex items-center rounded-xl text-xs cursor-pointer transition-colors duration-150 touch-manipulation ${
                    isEffectivelyCollapsed
                      ? 'justify-center h-10 w-10 mx-auto'
                      : 'w-full gap-3 px-3.5 py-2.5'
                  } ${
                    isActive
                      ? 'text-blue-950 dark:text-white font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/40 font-medium'
                  }`}
                  aria-label={item.label}
                >
                  {/* Pastilla activa compartida con animación física de resorte ultra-fluida */}
                  {isActive && (
                    <motion.div
                      layoutId={`${layoutPrefix}-pill`}
                      className="absolute inset-0 rounded-xl bg-slate-100 border border-slate-200/80 dark:bg-white/[0.06] dark:border-white/[0.08]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
                    />
                  )}

                  <span className={`relative z-10 flex items-center ${isEffectivelyCollapsed ? 'justify-center' : 'gap-3 w-full'}`}>
                    <Icon
                      className={`w-4.5 h-4.5 shrink-0 transition-all duration-200 ${
                        isActive
                          ? 'text-blue-600 dark:text-white'
                          : 'text-slate-500 dark:text-zinc-400 group-hover:text-slate-800 dark:group-hover:text-zinc-200'
                      }`}
                      strokeWidth={isActive ? 2.2 : 1.75}
                    />

                    {!isEffectivelyCollapsed && (
                      <>
                        <span className={`truncate tracking-tight transition-colors ${
                          isActive
                            ? 'text-slate-900 dark:text-white font-semibold'
                            : 'text-slate-600 dark:text-zinc-300 group-hover:text-slate-900 dark:group-hover:text-white'
                        }`}>
                          {item.label}
                        </span>

                        {/* Punto sutil activo */}
                        {isActive && (
                          <motion.span
                            layoutId={`${layoutPrefix}-dot`}
                            className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0"
                            transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
                          />
                        )}
                      </>
                    )}
                  </span>
                </motion.button>

                {/* Tooltip Flotante para modo colapsado (Mini Rail) */}
                {isEffectivelyCollapsed && (
                  <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-[#18181b] dark:text-zinc-100 border border-slate-800 dark:border-white/[0.08] text-xs font-medium shadow-2xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform -translate-x-1 group-hover:translate-x-0 flex items-center gap-1.5">
                    <span>{item.label}</span>
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-[#18181b]" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* 3. Footer del Sidebar: Selector de Módulos y Executive User Profile Card */}
      <div className={`shrink-0 border-t border-slate-200/80 dark:border-white/[0.07] bg-slate-50/70 dark:bg-[#0e0e11]/80 transition-colors ${
        onCloseMobile
          ? 'p-4 pb-8 md:pb-4'
          : isEffectivelyCollapsed
          ? 'p-2 flex flex-col items-center'
          : 'p-3'
      }`}>
        {/* Opción de Entorno Global (Ubicada arriba de Ober Osorio) */}
        {(onBackToMasterPlatform || onOpenGateway) && (
          <div ref={moduleMenuRef} className="relative w-full mb-2.5">
            {isEffectivelyCollapsed ? (
              <button
                type="button"
                onClick={() => setIsModuleMenuOpen(!isModuleMenuOpen)}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center text-purple-600 dark:text-purple-400 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-slate-700/60 shadow-xs transition-all cursor-pointer touch-manipulation"
                title="Entorno Global"
              >
                <Globe className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsModuleMenuOpen(!isModuleMenuOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-purple-400 dark:hover:border-purple-500 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition-all cursor-pointer group touch-manipulation"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">Entorno Global</span>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                    isModuleMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
            )}

            {/* Popover hacia arriba SOLO con opciones de Entorno Global */}
            <AnimatePresence>
              {isModuleMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.16 }}
                  className={`absolute bottom-full mb-2 ${
                    isEffectivelyCollapsed ? 'left-full ml-3 w-64' : 'left-0 right-0'
                  } bg-white dark:bg-[#1A2333] border border-slate-200 dark:border-slate-700/90 rounded-2xl shadow-2xl p-2 z-50 text-xs backdrop-blur-xl`}
                >
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Entornos Globales
                    </span>

                    {onBackToMasterPlatform && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsModuleMenuOpen(false);
                          onBackToMasterPlatform();
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors font-medium text-left cursor-pointer touch-manipulation"
                      >
                        <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <div className="flex-1 truncate">
                          <p className="font-semibold leading-tight">Plataforma Master</p>
                          <p className="text-[10px] text-slate-400 leading-tight">Gestión global SuperAdmin</p>
                        </div>
                      </button>
                    )}

                    {onOpenGateway && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsModuleMenuOpen(false);
                          onOpenGateway();
                        }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors font-medium text-left cursor-pointer touch-manipulation"
                      >
                        <ArrowLeftRight className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                        <div className="flex-1 truncate">
                          <p className="font-semibold leading-tight">Cambiar de Entorno</p>
                          <p className="text-[10px] text-slate-400 leading-tight">Selector Gateway de campañas</p>
                        </div>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        <UserProfileCard
          userName={userName}
          userEmail={userEmail}
          userRole={userRole}
          isCollapsed={isEffectivelyCollapsed}
          onSignOut={onSignOut}
        />
      </div>
    </motion.aside>
  );
};

