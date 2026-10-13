import React, { useState, useMemo } from 'react';
import {
  Target,
  UserPlus,
  Users,
  LogOut,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLeaderWorkspace } from './useLeaderWorkspace';
import { useLeaderVotesCount } from '../../hooks/useLeaderVotesCount';
import { useTenant } from '../../context/TenantContext';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import type { ElectorWithRegistrant } from '../../types';
import { LeaderDashboardView } from './LeaderDashboardView';
import { LeaderRegisterElectorView } from './LeaderRegisterElectorView';
import { LeaderVotesListView } from './LeaderVotesListView';
import { EditElectorModal } from '../electors/components/EditElectorModal';
import { DeleteConfirmModal } from '../electors/components/DeleteConfirmModal';

interface LeaderWorkspaceViewProps {
  userId: string;
  userName: string;
  userEmail: string;
  tenantId: string | null;
  tenantName?: string;
  isOwnerMode?: boolean;
  onSignOut: () => void;
  onBackToSelector?: () => void;
}

export const LeaderWorkspaceView: React.FC<LeaderWorkspaceViewProps> = ({
  userId,
  userName,
  userEmail: _userEmail,
  tenantId,
  tenantName = 'Campaña Electoral',
  isOwnerMode,
  onSignOut,
  onBackToSelector,
}) => {
  const isOwner = Boolean(isOwnerMode ?? (tenantId === null || userName.includes('Propietario')));
  const { currentTenant } = useTenant();

  // Conteo exacto y reactivo en tiempo real conectado directamente a Supabase
  const { votesCount, refreshCount } = useLeaderVotesCount({
    currentUserId: userId,
    tenantId: tenantId,
    isOwnerMode: isOwner,
  });

  const {
    electors: _electors,
    loading: _loading,
    personalGoal,
    deleteElector,
    updateElector,
    markWhatsAppSent,
    refreshElectors,
    stats,
  } = useLeaderWorkspace(userId, tenantId, isOwner);

  // Estadísticas sincronizadas con el conteo real reactivo
  const synchronizedStats = useMemo(() => ({
    ...stats,
    total: votesCount,
    percentage: personalGoal > 0 ? Math.min(100, Math.round((votesCount / personalGoal) * 100)) : 0,
    remaining: Math.max(0, personalGoal - votesCount),
  }), [stats, votesCount, personalGoal]);

  // Active navigation tab for leader
  const [activeTab, setActiveTab] = useState<'goal' | 'register' | 'list'>('goal');

  // Estados para modales de edición y eliminación de electores
  const [editingElector, setEditingElector] = useState<ElectorWithRegistrant | null>(null);
  const [deletingElector, setDeletingElector] = useState<ElectorWithRegistrant | null>(null);

  // Helper to open WhatsApp with custom voter message
  const handleOpenWhatsApp = (elector: {
    id: string;
    nombres: string;
    telefono?: string | null;
    puesto_votacion: string;
    mesa: number;
  }) => {
    if (!elector.telefono) return;
    const cleanPhone = elector.telefono.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
    const message = encodeURIComponent(
      `¡Hola ${elector.nombres}! Te saluda ${userName}, tu líder de confianza en ${tenantName}. Te confirmamos que tu puesto de votación asignado es ${elector.puesto_votacion}, Mesa ${elector.mesa}. ¡Contamos con tu valioso respaldo este día electoral! 🗳️🇨🇴`
    );

    markWhatsAppSent(elector.id);
    window.open(`https://wa.me/${phoneWithCode}?text=${message}`, '_blank');
  };

  // Navigation tab definitions
  const tabs = [
    { id: 'goal' as const, label: 'Mi Meta', icon: Target },
    { id: 'register' as const, label: 'Registrar', icon: UserPlus },
    { id: 'list' as const, label: 'Mis Votos', icon: Users, badge: votesCount },
  ];

  // Ancho responsivo del contenedor: expandido para la tabla de alta densidad
  const containerMaxWidth = activeTab === 'list' ? 'max-w-7xl' : 'max-w-2xl';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased transition-colors">
      {/* 1. Mobile-First Executive Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 px-4 py-3 transition-colors">
        <div className={`${containerMaxWidth} mx-auto flex items-center justify-between gap-3 transition-all duration-300`}>
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
            className="flex items-center gap-2.5 min-w-0 cursor-pointer select-none group active:scale-95 transition-transform"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-blue-600/25 ring-1 ring-blue-400/30 group-hover:ring-blue-300 transition-all shrink-0">
              LÍD
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{userName}</p>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono">
                  Líder
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{tenantName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onBackToSelector && (
              <button
                type="button"
                onClick={onBackToSelector}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                title="Volver a la selección de entornos"
              >
                <span>← Selector</span>
              </button>
            )}
            <ThemeToggle size="sm" />
            <button
              onClick={onSignOut}
              title="Cerrar sesión"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 2. Segmented Control Navigation (iOS / Linear style) */}
        <div className={`${containerMaxWidth} mx-auto mt-2.5 grid grid-cols-3 gap-1 bg-slate-100/90 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-1.5 backdrop-blur-md transition-all duration-300`}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="relative py-2.5 px-2 rounded-xl text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer z-10"
              >
                {isActive && (
                  <motion.div
                    layoutId="leader-tab"
                    className="absolute inset-0 bg-blue-600 rounded-xl shadow-sm shadow-blue-600/30 border border-blue-500/40"
                    transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                  />
                )}
                <span
                  className={`relative z-10 flex items-center gap-1.5 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold transition-colors ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 ${containerMaxWidth} w-full mx-auto p-4 sm:p-6 pb-20 transition-all duration-300`}>
        <AnimatePresence mode="wait">
          {/* TAB 1: MI META PERSONAL */}
          {activeTab === 'goal' && (
            <LeaderDashboardView
              userId={userId}
              currentUser={{
                id: userId,
                full_name: userName,
                campaign_name: tenantName,
                tenant_id: tenantId,
              }}
              isOwnerMode={isOwner}
              stats={synchronizedStats}
              personalGoal={personalGoal}
              onNavigateToRegister={() => setActiveTab('register')}
              onNavigateToList={() => setActiveTab('list')}
              onNavigateToVotes={() => setActiveTab('list')}
            />
          )}

          {/* TAB 2: REGISTRAR ELECTOR */}
          {activeTab === 'register' && (
            <LeaderRegisterElectorView
              currentUserId={userId}
              activeTenant={currentTenant || (tenantId ? { id: tenantId, name: tenantName } : null)}
              onSuccess={() => {
                refreshElectors();
                refreshCount();
              }}
            />
          )}

          {/* TAB 3: MIS ELECTORES REGISTRADOS (TABLA DE ALTA DENSIDAD CON DATOS REALES) */}
          {activeTab === 'list' && (
            <LeaderVotesListView
              isOwnerMode={isOwner}
              currentUserId={userId}
              activeTenantId={tenantId}
              onNavigateRegister={() => setActiveTab('register')}
              onOpenWhatsApp={handleOpenWhatsApp}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Modales de Edición y Eliminación para el Líder */}
      <EditElectorModal
        elector={editingElector}
        isOpen={Boolean(editingElector)}
        onClose={() => setEditingElector(null)}
        onSave={updateElector}
      />

      <DeleteConfirmModal
        elector={deletingElector}
        isOpen={Boolean(deletingElector)}
        onClose={() => setDeletingElector(null)}
        onConfirm={deleteElector}
      />
    </div>
  );
};
