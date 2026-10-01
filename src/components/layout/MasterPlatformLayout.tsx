import React, { useState, Suspense } from 'react';
import { Menu, Loader2 } from 'lucide-react';
import { MasterSidebar, type MasterTab } from './MasterSidebar';
import { ThemeToggle } from '../ui/ThemeToggle';
import { AnimatePresence, motion } from 'framer-motion';

const MasterDashboardView = React.lazy(() =>
  import('../../modules/superadmin/MasterDashboardView').then((m) => ({
    default: m.MasterDashboardView,
  }))
);
const TenantsManagementView = React.lazy(() =>
  import('../../modules/superadmin/TenantsManagementView').then((m) => ({
    default: m.TenantsManagementView,
  }))
);
const MasterUsersView = React.lazy(() =>
  import('../../modules/superadmin/MasterUsersView').then((m) => ({
    default: m.MasterUsersView,
  }))
);
const SystemHealthView = React.lazy(() =>
  import('../../modules/superadmin/SystemHealthView').then((m) => ({
    default: m.SystemHealthView,
  }))
);
const SecurityAuditView = React.lazy(() =>
  import('../../modules/superadmin/SecurityAuditView').then((m) => ({
    default: m.SecurityAuditView,
  }))
);

interface MasterPlatformLayoutProps {
  onSignOut?: () => void;
  onOpenGateway?: () => void;
  userName?: string;
  userEmail?: string;
}

const ViewLoadingFallback: React.FC = () => (
  <div className="w-full py-20 flex flex-col items-center justify-center text-slate-400">
    <Loader2 className="w-7 h-7 animate-spin text-purple-500 mb-2.5" />
    <span className="text-xs font-mono uppercase tracking-wider text-slate-500">
      Cargando módulo...
    </span>
  </div>
);

export const MasterPlatformLayout: React.FC<MasterPlatformLayoutProps> = ({
  onSignOut,
  onOpenGateway,
  userName = 'Ober Osorio',
  userEmail = 'oberosorio1@gmail.com',
}) => {
  const [activeTab, setActiveTab] = useState<MasterTab>('overview');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="h-[100dvh] w-full max-w-full bg-slate-50 dark:bg-[#070a12] text-slate-900 dark:text-slate-100 flex overflow-hidden transition-colors duration-200">
      {/* SuperAdmin Master Sidebar */}
      <MasterSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSignOut={onSignOut}
        onOpenGateway={onOpenGateway}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden">
        {/* Mobile Header Bar Fijo Superior (< 1024px lg) con Desvanecimiento Suave (Fade-Out Blur) sin borde rígido */}
        <header className="lg:hidden sticky top-0 z-50 w-full shrink-0 pt-[env(safe-area-inset-top,0px)] pointer-events-none transition-all">
          {/* Capa de fondo con degradado de desvanecimiento hacia transparente (SIN borde inferior) */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50 via-slate-50/95 via-80% to-transparent dark:from-[#070b14] dark:via-[#070b14]/95 dark:via-80% dark:to-transparent backdrop-blur-md pointer-events-none" />

          {/* Contenedor interactivo de controles */}
          <div className="relative max-w-7xl mx-auto px-3.5 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-3 pointer-events-auto pb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="w-11 h-11 rounded-2xl text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white bg-white/95 dark:bg-[#0b1427]/90 border border-slate-200 dark:border-[#1b2b50]/80 flex items-center justify-center active:scale-95 touch-manipulation transition-all cursor-pointer shrink-0 shadow-lg shadow-slate-900/5 dark:shadow-black/20"
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" strokeWidth={2.3} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  window.location.reload();
                }}
                title="Recargar plataforma"
                aria-label="Recargar plataforma"
                className="flex items-center gap-2 px-3.5 py-2 min-h-[44px] rounded-2xl bg-white/95 hover:bg-slate-100 dark:bg-[#0c162d]/90 dark:hover:bg-[#101e3d] border border-slate-200/90 dark:border-[#1d2f59]/80 shadow-lg shadow-slate-900/5 dark:shadow-black/20 min-w-0 cursor-pointer select-none active:scale-95 transition-all"
              >
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white font-mono truncate">
                  SUPERADMIN
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onOpenGateway && (
                <button
                  type="button"
                  onClick={onOpenGateway}
                  className="px-3.5 h-11 text-xs font-bold rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-lg shadow-black/10"
                >
                  Selector
                </button>
              )}
              <ThemeToggle size="md" />
            </div>
          </div>

          {/* Franja difusora extra para transición suave del scroll */}
          <div className="h-4 w-full bg-gradient-to-b from-slate-50/40 dark:from-[#070b14]/40 to-transparent pointer-events-none -mt-1" />
        </header>

        {/* View Switcher with Smooth Animated Transitions & Code Splitting */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-safe max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Suspense fallback={<ViewLoadingFallback />}>
                {activeTab === 'overview' && (
                  <MasterDashboardView
                    onNavigateToTenants={() => setActiveTab('tenants')}
                    onNavigateToHealth={() => setActiveTab('health')}
                  />
                )}

                {activeTab === 'tenants' && <TenantsManagementView />}

                {activeTab === 'users' && <MasterUsersView />}

                {activeTab === 'health' && <SystemHealthView />}

                {activeTab === 'audit' && <SecurityAuditView />}
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
