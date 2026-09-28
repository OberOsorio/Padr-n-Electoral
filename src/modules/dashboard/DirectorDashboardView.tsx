import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Target,
  RefreshCw,
  UserPlus,
  UploadCloud,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { useDashboardData } from './useDashboardData';
import { StatCard } from './components/StatCard';
import { OperativeTeamTable } from './components/OperativeTeamTable';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter';
import { motion } from 'framer-motion';

export interface DirectorDashboardViewProps {
  onNavigateToElectors?: () => void;
  onNavigateToRegister?: () => void;
  onNavigateToBulkUpload?: () => void;
  onNavigateToTeam?: () => void;
  userName?: string;
}

export const DirectorDashboardView: React.FC<DirectorDashboardViewProps> = ({
  onNavigateToElectors: _onNavigateToElectors,
  onNavigateToRegister,
  onNavigateToBulkUpload,
  onNavigateToTeam,
  userName = 'Director de Campaña',
}) => {
  const {
    metrics,
    teamMembers,
    loading,
    lastEventTimestamp,
    refetch,
  } = useDashboardData();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Formato para última sincronización
  const lastSyncTime = lastEventTimestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto pb-24 md:pb-10 animate-in fade-in duration-300">
      {/* 1. Cabecera Ejecutiva */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/80 transition-colors">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Panel General de Campaña
            </h1>
            {userName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25 shadow-2xs">
                <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>ADMIN / CANDIDATO: {userName}</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitoreo ejecutivo de votantes consolidados y efectividad de la estructura operativa en terreno.
          </p>
        </div>

        {/* Botonera Superior con Acciones Rápidas */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-center">
          {onNavigateToRegister && (
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer shrink-0 active:scale-[0.98]"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Registrar Elector</span>
            </button>
          )}

          {onNavigateToBulkUpload && (
            <button
              type="button"
              onClick={onNavigateToBulkUpload}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0 active:scale-[0.98]"
            >
              <UploadCloud className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Carga Masiva</span>
            </button>
          )}

          {/* Botón de Actualizar con estado de rotación */}
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-2xs shrink-0"
            title={`Última sincronización: ${lastSyncTime}`}
            aria-label="Actualizar métricas"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Fila Superior de Métricas Clave (3 Tarjetas Balanceadas) */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
        }}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6"
      >
        {/* Tarjeta 1: TOTAL PADRÓN REGISTRADO */}
        <StatCard
          title="TOTAL PADRÓN REGISTRADO"
          value={metrics.totalElectores}
          subtitle="Electores únicos inscritos en la plataforma"
          icon={Users}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/40"
          spotlightColor="rgba(37, 99, 235, 0.16)"
          badge={
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              Padrón Activo e Ilimitado
            </span>
          }
          trendText={metrics.totalElectores > 0 ? "Padrón verificado en sistema" : "Sin electores cargados"}
          trendPositive={metrics.totalElectores > 0}
        />

        {/* Tarjeta 2: EQUIPO OPERATIVO EN TERRENO */}
        <StatCard
          title="EQUIPO OPERATIVO EN TERRENO"
          value=""
          customValue={
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-3xl font-semibold text-slate-900 dark:text-white tabular-nums tracking-tight">
                <AnimatedCounter value={metrics.equipoOperativoActivo} />
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                activos
              </span>
            </div>
          }
          subtitle="Coordinadores y líderes asignados"
          icon={UserCheck}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/40"
          spotlightColor="rgba(16, 185, 129, 0.16)"
          trendText={`${metrics.coordinadoresActivos} Coordinadores • ${metrics.lideresActivos} Líderes`}
          trendPositive={metrics.equipoOperativoActivo > 0}
        />

        {/* Tarjeta 3: CUMPLIMIENTO GLOBAL DE METAS */}
        <StatCard
          title="CUMPLIMIENTO GLOBAL DE METAS"
          value=""
          customValue={
            <div className="flex items-baseline gap-2 font-mono">
              <span className="text-3xl font-semibold text-slate-900 dark:text-white tabular-nums tracking-tight">
                <AnimatedCounter value={metrics.cumplimientoGlobalPct} suffix="%" />
              </span>
            </div>
          }
          progressPercentage={metrics.cumplimientoGlobalPct}
          subtitle={`${metrics.totalElectores.toLocaleString()} registrados de ${metrics.metaGlobal.toLocaleString()} proyectada`}
          icon={Target}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/40"
          spotlightColor="rgba(245, 158, 11, 0.16)"
          badge={
            metrics.cumplimientoGlobalPct >= 100 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                <span>Meta Superada</span>
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                En Progreso
              </span>
            )
          }
          trendText={metrics.metaGlobal > 0 ? `Cuota global: ${metrics.metaGlobal.toLocaleString()} electores` : "Sin cuotas fijadas"}
          trendPositive={metrics.cumplimientoGlobalPct >= 50}
        />
      </motion.div>

      {/* 3. Bloque Central: "Rendimiento Operativo por Colaborador" */}
      <div className="w-full">
        <OperativeTeamTable
          members={teamMembers}
          onNavigateToTeam={onNavigateToTeam}
        />
      </div>
    </div>
  );
};
