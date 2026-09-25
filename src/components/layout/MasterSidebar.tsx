import React from 'react';
import {
  LayoutGrid,
  Building2,
  Activity,
  ShieldAlert,
  Layers,
  X,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ThemeToggle } from '../ui/ThemeToggle';
import { MasterUserCard } from './MasterUserCard';
import { motion } from 'framer-motion';

export type MasterTab = 'overview' | 'tenants' | 'health' | 'audit';

interface MasterSidebarProps {
  activeTab: MasterTab;
  onSelectTab: (tab: MasterTab) => void;
  onSignOut?: () => void;
  onOpenGateway?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const MasterSidebar: React.FC<MasterSidebarProps> = ({
  activeTab,
  onSelectTab,
  onSignOut,
  onOpenGateway,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut();
    } else {
      await supabase.auth.signOut();
    }
  };

  const navItems = [
    {
      id: 'overview' as MasterTab,
      label: 'Resumen Global',
      icon: LayoutGrid,
      description: 'Métricas y capacidad SaaS',
    },
    {
      id: 'tenants' as MasterTab,
      label: 'Campañas y Clientes',
      icon: Building2,
      description: 'Gestión y estado de tenants',
    },
    {
      id: 'health' as MasterTab,
      label: 'Salud e Infraestructura',
      icon: Activity,
      description: 'Rendimiento y estado de servicios',
    },
    {
      id: 'audit' as MasterTab,
      label: 'Auditoría de Accesos',
      icon: ShieldAlert,
      description: 'Seguridad y logs inmutables',
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#0b0f19] border-r border-slate-200 dark:border-purple-900/30 text-slate-700 dark:text-slate-300 transition-colors">
      {/* Platform Branding Header */}
      <div className="p-5 border-b border-slate-200 dark:border-purple-900/20 bg-gradient-to-b from-purple-50/60 dark:from-purple-950/30 via-transparent to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/25 ring-1 ring-purple-400/40">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 dark:text-white tracking-wider block">
                PADRÓN
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                Master Platform Control
              </p>
            </div>
          </div>

          {/* ThemeToggle and Close button for mobile */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle size="sm" />
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Cerrar panel"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3.5 space-y-1.5 overflow-y-auto">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-3 py-1">
          Navegación de Plataforma
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <div key={item.id} className="relative group w-full">
              <motion.button
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className={`relative w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left cursor-pointer transition-colors duration-150 ${
                  isActive
                    ? 'text-purple-950 dark:text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/40'
                }`}
              >
                {/* Pastilla animada compartida con layoutId */}
                {isActive && (
                  <motion.div
                    layoutId="active-master-sidebar-pill"
                    className="absolute inset-0 rounded-xl bg-purple-50 border border-purple-200 shadow-xs dark:bg-purple-950/60 dark:border-purple-500/40 dark:shadow-[0_0_15px_rgba(168,85,247,0.18)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}

                {/* Barra indicadora izquierda animada con layoutId */}
                {isActive && (
                  <motion.span
                    layoutId="active-master-sidebar-bar"
                    className="absolute left-0 top-2.5 bottom-2.5 w-1 bg-purple-600 dark:bg-purple-400 rounded-r shadow-[0_0_10px_rgba(168,85,247,0.9)] z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}

                {/* Contenido relativo por encima de la pastilla */}
                <div className="relative z-10 flex items-center gap-3 w-full">
                  <div
                    className={`p-2 rounded-lg transition-colors shrink-0 ${
                      isActive
                        ? 'bg-purple-600 text-white shadow-xs shadow-purple-600/30 dark:bg-purple-600 dark:text-white'
                        : 'bg-slate-100 text-slate-500 group-hover:text-purple-600 group-hover:bg-purple-50 dark:bg-slate-800/80 dark:text-slate-400 dark:group-hover:text-purple-300 dark:group-hover:bg-purple-950/40'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold leading-tight ${
                      isActive
                        ? 'text-purple-950 dark:text-white'
                        : 'text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'
                    }`}>
                      {item.label}
                    </p>
                    <p className={`text-[10px] truncate mt-0.5 ${
                      isActive
                        ? 'text-purple-700 dark:text-purple-300/80 font-medium'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      {item.description}
                    </p>
                  </div>

                  {isActive && (
                    <motion.span
                      layoutId="active-master-sidebar-dot"
                      className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.6)] dark:shadow-[0_0_8px_rgba(192,132,252,0.9)] shrink-0"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                </div>
              </motion.button>
            </div>
          );
        })}
      </nav>

      {/* Selector de Entornos / Modo Campaña */}
      {onOpenGateway && (
        <div className="p-3 border-t border-slate-200 dark:border-purple-900/20">
          <button
            type="button"
            onClick={onOpenGateway}
            className="w-full flex items-center justify-between p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/25 text-purple-700 dark:text-purple-300 transition-all text-xs font-semibold group cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-500 group-hover:scale-110 transition-transform" />
              <span>Inspeccionar Campaña</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-purple-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      )}

      {/* Footer SuperAdmin Profile Card */}
      <div className="p-3 sm:p-3.5 border-t border-slate-200 dark:border-purple-900/20 bg-slate-50/50 dark:bg-slate-950/40">
        <MasterUserCard onSignOut={handleSignOut} />
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-64 xl:w-72 h-screen sticky top-0 shrink-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
