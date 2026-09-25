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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useSidebar } from '../../context/SidebarContext';
import { UserProfileCard } from './UserProfileCard';

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
  { id: 'coordinators', label: 'Equipo y Coordinadores', icon: ShieldCheck },
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
  className,
}: SidebarProps) => {
  const { isCollapsed, toggleSidebar } = useSidebar();

  const effectiveNavItems = NAV_ITEMS;

  // En modal móvil nunca se colapsa en mini-rail; siempre se muestra con texto completo
  const isEffectivelyCollapsed = isCollapsed && !onCloseMobile;

  return (
    <motion.aside
      initial={false}
      animate={{
        width: onCloseMobile ? '100%' : isEffectivelyCollapsed ? 80 : 280,
      }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className={`shrink-0 h-screen sticky top-0 bg-white dark:bg-[#161F30]/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-700/60 flex flex-col justify-between select-none z-30 transition-colors duration-200 overflow-visible ${
        className ?? 'hidden md:flex'
      }`}
    >
      {/* 1. Header del Sidebar */}
      <div>
        <div className={`border-b border-slate-200 dark:border-slate-700/60 transition-all ${
          isEffectivelyCollapsed ? 'p-3 flex flex-col items-center gap-3' : 'p-4.5'
        }`}>
          {isEffectivelyCollapsed ? (
            /* Header en Modo Colapsado / Mini Rail */
            <>
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-500/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm relative shrink-0">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
              </div>

              {/* Botón para expandir el panel */}
              <button
                type="button"
                onClick={toggleSidebar}
                className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/40 hover:shadow-[0_0_12px_rgba(37,99,235,0.25)] transition-all cursor-pointer"
                title="Expandir panel lateral (Ctrl+B)"
                aria-label="Expandir panel lateral"
              >
                <PanelLeftOpen className="w-4.5 h-4.5" />
              </button>
            </>
          ) : (
            /* Header en Modo Expandido */
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-500/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm relative shrink-0">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight leading-tight truncate">
                      Padrón Electoral
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Selector de Tema Claro / Oscuro */}
                  <ThemeToggle size="sm" />

                  {/* Botón de colapso en escritorio */}
                  {!onCloseMobile && (
                    <button
                      type="button"
                      onClick={toggleSidebar}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/40 hover:shadow-[0_0_12px_rgba(37,99,235,0.25)] transition-all cursor-pointer"
                      title="Colapsar panel lateral (Ctrl+B)"
                      aria-label="Colapsar panel lateral"
                    >
                      <PanelLeftClose className="w-4.5 h-4.5" />
                    </button>
                  )}

                  {/* Botón de cierre en vista móvil */}
                  {onCloseMobile && (
                    <button
                      type="button"
                      onClick={onCloseMobile}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      title="Cerrar Menú"
                      aria-label="Cerrar Menú"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 2. Menú de Funciones */}
        <nav className={`p-2 space-y-1.5 ${isEffectivelyCollapsed ? 'flex flex-col items-center' : ''}`}>
          {!isEffectivelyCollapsed && (
            <p className="px-3 pt-3 pb-1 text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-slate-400">
              Navegación
            </p>
          )}

          {effectiveNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <div key={item.id} className="relative group w-full flex justify-center">
                <motion.button
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile?.();
                  }}
                  whileHover={{ x: isEffectivelyCollapsed ? 0 : 2, scale: isEffectivelyCollapsed ? 1.05 : 1 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className={`relative flex items-center rounded-xl text-xs font-medium cursor-pointer transition-colors duration-150 ${
                    isEffectivelyCollapsed
                      ? 'justify-center h-10 w-10 mx-auto'
                      : 'w-full gap-3 px-3 py-2.5'
                  } ${
                    isActive
                      ? 'text-blue-700 font-semibold dark:text-blue-300 dark:font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
                  }`}
                  aria-label={item.label}
                >
                  {/* Pastilla activa compartida con layoutId */}
                  {isActive && (
                    <motion.div
                      layoutId="active-sidebar-pill"
                      className="absolute inset-0 rounded-xl bg-blue-50 border border-blue-200/80 shadow-xs dark:bg-blue-600/25 dark:border-blue-500/40 dark:shadow-[0_0_18px_rgba(37,99,235,0.25)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}

                  {/* Indicador de barra izquierda compartida en modo expandido */}
                  {isActive && !isEffectivelyCollapsed && (
                    <motion.span
                      layoutId="active-sidebar-bar"
                      className="absolute left-0 top-2 bottom-2 w-1 bg-blue-600 dark:bg-blue-400 rounded-r shadow-[0_0_10px_rgba(37,99,235,0.9)] z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}

                  <span className={`relative z-10 flex items-center ${isEffectivelyCollapsed ? 'justify-center' : 'gap-3 w-full'}`}>
                    <Icon
                      className={`w-4.5 h-4.5 shrink-0 transition-colors ${
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                      }`}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />

                    {!isEffectivelyCollapsed && (
                      <>
                        <span className="truncate">{item.label}</span>
                        {isActive && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shadow-[0_0_6px_rgba(37,99,235,0.6)] dark:shadow-[0_0_8px_rgba(96,165,250,0.9)]" />
                        )}
                      </>
                    )}
                  </span>
                </motion.button>

                {/* Tooltip Flotante para modo colapsado (Mini Rail) */}
                {isEffectivelyCollapsed && (
                  <div className="absolute left-full ml-3.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 border border-slate-700/80 text-xs font-medium shadow-2xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-150 transform -translate-x-1 group-hover:translate-x-0 flex items-center gap-1.5">
                    <span>{item.label}</span>
                    <span className="absolute -left-1 top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900 dark:border-r-slate-800" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>

      {/* 3. Footer del Sidebar: Executive User Profile Card */}
      <div className={`border-t border-slate-200 dark:border-slate-700/60 bg-slate-50/70 dark:bg-[#0F172A]/80 transition-colors ${
        isEffectivelyCollapsed ? 'p-2 flex flex-col items-center' : 'p-3'
      }`}>
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

