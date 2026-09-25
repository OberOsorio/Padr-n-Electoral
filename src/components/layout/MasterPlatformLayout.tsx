import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import { MasterSidebar, type MasterTab } from './MasterSidebar';
import { MasterDashboardView } from '../../modules/superadmin/MasterDashboardView';
import { TenantsManagementView } from '../../modules/superadmin/TenantsManagementView';
import { SystemHealthView } from '../../modules/superadmin/SystemHealthView';
import { SecurityAuditView } from '../../modules/superadmin/SecurityAuditView';
import { ThemeToggle } from '../ui/ThemeToggle';
import { AnimatePresence, motion } from 'framer-motion';

interface MasterPlatformLayoutProps {
  onSignOut?: () => void;
  onOpenGateway?: () => void;
}

export const MasterPlatformLayout: React.FC<MasterPlatformLayoutProps> = ({ onSignOut, onOpenGateway }) => {
  const [activeTab, setActiveTab] = useState<MasterTab>('overview');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="h-[100dvh] w-full bg-slate-50 dark:bg-[#070a12] text-slate-900 dark:text-slate-100 flex overflow-hidden transition-colors duration-200">
      {/* SuperAdmin Master Sidebar */}
      <MasterSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSignOut={onSignOut}
        onOpenGateway={onOpenGateway}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto">
        {/* Mobile Header Bar Fijo Superior */}
        <header className="lg:hidden sticky top-0 z-30 w-full shrink-0 h-16 bg-white/95 dark:bg-[#070a12]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-purple-900/30 px-4 sm:px-6 flex items-center justify-between transition-colors shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="p-2.5 -ml-1.5 rounded-xl text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition-all cursor-pointer shrink-0"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" strokeWidth={2.3} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900 dark:text-white font-mono">
                SUPERADMIN
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenGateway && (
              <button
                type="button"
                onClick={onOpenGateway}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 transition-colors cursor-pointer"
              >
                Selector
              </button>
            )}
            <ThemeToggle size="sm" />
          </div>
        </header>

        {/* View Switcher with Smooth Animated Transitions */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {activeTab === 'overview' && (
                <MasterDashboardView
                  onNavigateToTenants={() => setActiveTab('tenants')}
                  onNavigateToHealth={() => setActiveTab('health')}
                />
              )}

              {activeTab === 'tenants' && <TenantsManagementView />}

              {activeTab === 'health' && <SystemHealthView />}

              {activeTab === 'audit' && <SecurityAuditView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
