import React from 'react';
import { Users, Target, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLeaderVotesCount } from '../../hooks/useLeaderVotesCount';

interface NavTabsProps {
  activeTab: 'goal' | 'register' | 'list';
  onTabChange: (tab: 'goal' | 'register' | 'list') => void;
  currentUser: {
    id: string;
    tenant_id?: string | null;
  };
  isOwnerMode?: boolean;
}

export const LeaderNavigationTabs: React.FC<NavTabsProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  isOwnerMode = false,
}) => {
  // Consumir el conteo con los mismos filtros de la tabla
  const { votesCount } = useLeaderVotesCount({
    currentUserId: currentUser?.id,
    tenantId: currentUser?.tenant_id,
    isOwnerMode,
  });

  const tabs = [
    { id: 'goal' as const, label: 'Mi Meta', icon: Target },
    { id: 'register' as const, label: 'Registrar', icon: UserPlus },
    { id: 'list' as const, label: 'Mis Votos', icon: Users, badge: votesCount },
  ];

  return (
    <div className="flex items-center justify-center p-1.5 bg-slate-100/90 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 max-w-xl mx-auto shadow-sm w-full">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <motion.button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`relative flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              isActive
                ? 'text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="active-leader-nav-pill"
                className="absolute inset-0 bg-blue-600 rounded-xl shadow-md shadow-blue-600/30 border border-blue-500/40"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}

            <span className="relative z-10 flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>

              {/* BADGE CON NÚMERO REAL SINCRONIZADO */}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
