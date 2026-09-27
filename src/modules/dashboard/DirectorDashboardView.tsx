import {
  Users,
  MapPin,
  UserCheck,
  RefreshCw,
  UserPlus,
  UploadCloud,
} from 'lucide-react';
import { useDashboardData } from './useDashboardData';
import { StatCard } from './components/StatCard';
import { TopPollingPlaces } from './components/TopPollingPlaces';
import { RecentElectorsFeed } from './components/RecentElectorsFeed';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter';
import { motion } from 'framer-motion';

export interface DirectorDashboardViewProps {
  onNavigateToElectors?: () => void;
  onNavigateToRegister?: () => void;
  onNavigateToBulkUpload?: () => void;
  userName?: string;
}

export const DirectorDashboardView = ({
  onNavigateToElectors,
  onNavigateToRegister,
  onNavigateToBulkUpload,
  userName = 'Director de Campaña',
}: DirectorDashboardViewProps) => {
  const {
    metrics,
    topPollingPlaces,
    recentElectors,
    loading,
    isLiveActive,
    lastEventTimestamp,
    refetch,
  } = useDashboardData();

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Formato para última sincronización
  const lastSyncTime = lastEventTimestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const puestosConElectores = metrics.puestosConElectores ?? 0;
  const totalPuestosCampana = metrics.totalPuestosCampana ?? 0;
  const lideresConRegistros = metrics.lideresConRegistros ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto pb-24 md:pb-10 animate-in fade-in duration-300">
      {/* 1. Cabecera Ejecutiva con Acciones Rápidas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/80 transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">
              Panel de Gestión de Electores
            </h1>
            {userName && (
              <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                {userName}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitoreo en tiempo real del censo electoral y actividad de líderes en terreno.
          </p>
        </div>

        {/* Acciones Rápidas Directas */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-center">
          {onNavigateToRegister && (
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Registrar Elector</span>
            </button>
          )}

          {onNavigateToBulkUpload && (
            <button
              type="button"
              onClick={onNavigateToBulkUpload}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer shrink-0"
            >
              <UploadCloud className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>Carga Masiva</span>
            </button>
          )}

          {/* Botón de actualización de métricas */}
          <button
            type="button"
            onClick={() => refetch()}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-xs shrink-0"
            title={`Última sincronización: ${lastSyncTime}`}
            aria-label="Actualizar métricas"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Fila Superior de Métricas Clave (3 Tarjetas KPI Directas) */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
        }}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5"
      >
        {/* KPI 1: Total Padrón Registrado */}
        <StatCard
          title="Total Padrón Registrado"
          value={metrics.totalElectores}
          subtitle="Electores cargados y consolidados en la campaña"
          icon={Users}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/40"
          spotlightColor="rgba(37, 99, 235, 0.16)"
          trendText={metrics.totalElectores > 0 ? "Padrón activo y consolidado" : "Sin electores registrados"}
          trendPositive={metrics.totalElectores > 0}
        />

        {/* KPI 2: Puestos de Votación con Votos */}
        <StatCard
          title="Puestos de Votación con Votos"
          value=""
          customValue={
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-3xl font-semibold text-slate-900 dark:text-white tabular-nums tracking-tight">
                <AnimatedCounter value={puestosConElectores} />
              </span>
              <span className="text-base font-normal text-slate-500 dark:text-slate-400">
                de {totalPuestosCampana}
              </span>
            </div>
          }
          subtitle="Centros electorales con presencia de electores"
          icon={MapPin}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/40"
          spotlightColor="rgba(16, 185, 129, 0.16)"
          trendText={puestosConElectores > 0 ? "Cobertura activa en terreno" : "Sin puestos cubiertos"}
          trendPositive={puestosConElectores > 0}
        />

        {/* KPI 3: Líderes Activos Registrando */}
        <StatCard
          title="Líderes Activos Registrando"
          value=""
          customValue={
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-3xl font-semibold text-slate-900 dark:text-white tabular-nums tracking-tight">
                <AnimatedCounter value={lideresConRegistros} />
              </span>
              <span className="text-base font-normal text-slate-500 dark:text-slate-400">
                activos
              </span>
            </div>
          }
          subtitle="Miembros del equipo reportando en terreno"
          icon={UserCheck}
          iconColor="text-indigo-600 dark:text-indigo-400"
          iconBg="bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800/40"
          spotlightColor="rgba(99, 102, 241, 0.16)"
          trendText={lideresConRegistros > 0 ? "Reportando en tiempo real" : "Sin líderes con registros"}
          trendPositive={lideresConRegistros > 0}
        />
      </motion.div>

      {/* 3. Bloque Central Operativo Dividido */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda (7 cols): Electores por Puesto de Votación */}
        <div className="lg:col-span-7">
          <TopPollingPlaces
            places={topPollingPlaces}
            totalElectores={metrics.totalElectores}
          />
        </div>

        {/* Columna Derecha (5 cols): Feed de Últimos Electores Registrados en Tiempo Real */}
        <div className="lg:col-span-5">
          <RecentElectorsFeed
            electors={recentElectors}
            isLive={isLiveActive}
            onNavigateToElectors={onNavigateToElectors}
          />
        </div>
      </div>
    </div>
  );
};
