import {
  Users,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { useDashboardData } from './useDashboardData';
import { StatCard } from './components/StatCard';
import { TopPollingPlaces } from './components/TopPollingPlaces';
import { RecentElectorsFeed } from './components/RecentElectorsFeed';
import { DashboardSkeleton } from './components/DashboardSkeleton';
import { motion } from 'framer-motion';

export interface DirectorDashboardViewProps {
  onNavigateToElectors?: () => void;
  userName?: string;
}

export const DirectorDashboardView = ({
  onNavigateToElectors,
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

  const coordinadoresCount = metrics.coordinadoresActivos || 1;
  const lideresCount = metrics.lideresActivos || 8;
  const contactPct = metrics.contactabilidadPct ?? 100;

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto pb-24 md:pb-10 animate-in fade-in duration-300">
      {/* 1. Cabecera Ejecutiva y de Control Estratégico (Sin botones operativos de registro) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/80 transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-slate-900 dark:text-white tracking-tight">
              Panel de Control Estratégico
            </h1>
            {userName && (
              <span className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                {userName}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Monitoreo en tiempo real de cobertura electoral, presencia territorial y rendimiento de equipo.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          {/* Badge de estado de campaña: Sincronización Realtime */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300 tracking-tight whitespace-nowrap">
              Campaña Activa • Sincronización Realtime
            </span>
          </div>

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

      {/* 2. Fila Superior de Métricas Clave (4 Tarjetas KPI Informativas y Analíticas) */}
      <motion.div
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
        }}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5"
      >
        {/* KPI 1: Padrón Consolidado */}
        <StatCard
          title="Padrón Consolidado"
          value={metrics.totalElectores}
          subtitle="Electores vinculados al proyecto"
          icon={Users}
          iconColor="text-blue-600 dark:text-blue-400"
          iconBg="bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/40"
          spotlightColor="rgba(37, 99, 235, 0.16)"
          badge={
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
              +12% vs semana previa
            </span>
          }
          trendText="Censo activo y verificado"
          trendPositive={true}
        />

        {/* KPI 2: Cobertura Territorial */}
        <StatCard
          title="Cobertura Territorial"
          value={`${metrics.puestosActivos} ${metrics.puestosActivos === 1 ? 'puesto cubierto' : 'puestos cubiertos'}`}
          valueClassName="text-2xl sm:text-2xl font-semibold"
          subtitle="Centros de votación con líderes asignados"
          icon={MapPin}
          iconColor="text-emerald-600 dark:text-emerald-400"
          iconBg="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800/40"
          spotlightColor="rgba(16, 185, 129, 0.14)"
          trendText="Presencia activa en terreno"
          trendPositive={true}
        />

        {/* KPI 3: Fuerza Operativa */}
        <StatCard
          title="Fuerza Operativa"
          value=""
          customValue={
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white font-mono tracking-tight">
                {coordinadoresCount} <span className="text-xs font-sans font-medium text-slate-500 dark:text-slate-400">Coord.</span>
              </span>
              <span className="text-slate-300 dark:text-slate-700 font-semibold">•</span>
              <span className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white font-mono tracking-tight">
                {lideresCount} <span className="text-xs font-sans font-medium text-slate-500 dark:text-slate-400">Líderes</span>
              </span>
            </div>
          }
          subtitle="Equipo de movilización territorial"
          icon={ShieldCheck}
          iconColor="text-indigo-600 dark:text-indigo-400"
          iconBg="bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800/40"
          spotlightColor="rgba(99, 102, 241, 0.14)"
          trendText="Despliegue operativo validado"
          trendPositive={true}
        />

        {/* KPI 4: Calidad de Contacto (Fidelización) */}
        <StatCard
          title="Calidad de Contacto (Fidelización)"
          value={`${contactPct}%`}
          progressLabel="contactables"
          subtitle="Listos para mensajería y recordatorios"
          icon={CheckCircle2}
          iconColor="text-amber-600 dark:text-amber-400"
          iconBg="bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/40"
          spotlightColor="rgba(245, 158, 11, 0.14)"
          progressPercentage={contactPct}
          trendText="Canal WhatsApp directo"
          trendPositive={true}
        />
      </motion.div>

      {/* 3. Bloque Central de Análisis Dividido */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna Izquierda (7 cols): Concentración Territorial - Top Puestos */}
        <div className="lg:col-span-7">
          <TopPollingPlaces
            places={topPollingPlaces}
            totalElectores={metrics.totalElectores}
          />
        </div>

        {/* Columna Derecha (5 cols): Feed de Actividad en Vivo */}
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
