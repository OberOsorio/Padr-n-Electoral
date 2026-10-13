import React from 'react';
import { Users, Target, UserPlus } from 'lucide-react';
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

  return (
    <div className="flex items-center justify-center p-1.5 bg-slate-100/90 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 max-w-xl mx-auto shadow-sm w-full">
      {/* Tab: Mi Meta */}
      <button
        type="button"
        onClick={() => onTabChange('goal')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          activeTab === 'goal'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Target className="w-3.5 h-3.5" />
        <span>Mi Meta</span>
      </button>

      {/* Tab: Registrar */}
      <button
        type="button"
        onClick={() => onTabChange('register')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          activeTab === 'register'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span>Registrar</span>
      </button>

      {/* Tab: Mis Votos con Badge Real */}
      <button
        type="button"
        onClick={() => onTabChange('list')}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
          activeTab === 'list'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Users className="w-3.5 h-3.5" />
        <span>Mis Votos</span>

        {/* BADGE CON NÚMERO REAL SINCRONIZADO */}
        {votesCount > 0 && (
          <span
            className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full transition-colors ${
              activeTab === 'list'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}
          >
            {votesCount}
          </span>
        )}
      </button>
    </div>
  );
};
