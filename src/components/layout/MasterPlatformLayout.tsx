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
}

export const MasterPlatformLayout: React.FC<MasterPlatformLayoutProps> = ({ onSignOut }) => {
  const [activeTab, setActiveTab] = useState<MasterTab>('overview');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070a12] text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* SuperAdmin Master Sidebar */}
      <MasterSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSignOut={onSignOut}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Mobile Header Bar (Only visible on mobile < lg) */}
        <header className="lg:hidden sticky top-0 z-20 h-14 bg-white/90 dark:bg-[#0b0f19]/90 backdrop-blur-md border-b border-slate-200 dark:border-purple-900/20 px-3 sm:px-4 flex items-center justify-between transition-colors">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="p-2 -ml-1 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white font-mono">
              SuperAdmin
            </span>
          </div>

          <ThemeToggle size="sm" />
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
