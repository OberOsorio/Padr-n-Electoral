import React from 'react';
import {
  TrendingUp,
  Target,
  UserPlus,
  Phone,
  MapPin,
  Users,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLeaderMetrics } from './useLeaderMetrics';

export interface LeaderDashboardProps {
  currentUser?: {
    id: string;
    full_name?: string;
    campaign_name?: string;
  };
  userId?: string;
  stats?: {
    total: number;
    goal: number;
    remaining: number;
    percentage: number;
    withPhone: number;
    topPuesto: string;
    topPuestoCount: number;
  };
  personalGoal?: number;
  onNavigateToRegister?: () => void;
  onNavigateToVotes?: () => void;
  onNavigateToList?: () => void;
}

export const LeaderDashboardView: React.FC<LeaderDashboardProps> = ({
  currentUser,
  userId,
  stats,
  personalGoal,
  onNavigateToRegister,
  onNavigateToVotes,
  onNavigateToList,
}) => {
  const activeUserId = currentUser?.id || userId;
  const { metrics, loading } = useLeaderMetrics(activeUserId);

  // Navegación combinada (soporta onNavigateToVotes y onNavigateToList)
  const handleNavigateToList = onNavigateToVotes || onNavigateToList;

  // Si useLeaderMetrics tiene datos reales, los usamos; si no, fallback a stats heredado
  const displayTotal = activeUserId ? metrics.totalRegistrados : stats?.total ?? 0;
  const displayMeta = activeUserId
    ? metrics.meta
    : (stats?.goal || personalGoal || 50);
  const displayPorcentaje = activeUserId
    ? metrics.porcentajeAvance
    : (stats?.percentage ?? 0);
  const displayWithPhone = activeUserId ? metrics.conWhatsapp : stats?.withPhone ?? 0;
  const displayTopPuesto = activeUserId
    ? metrics.puestoPrincipal
    : (stats?.topPuesto || 'Sin registros aún');

  const esSuperada = displayTotal >= displayMeta && displayMeta > 0;
  const restantes = Math.max(0, displayMeta - displayTotal);

  return (
    <motion.div
      key="tab-goal"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-4 max-w-2xl mx-auto px-1 sm:px-3 py-2 transition-colors"
    >
      {/* 1. TARJETA PRINCIPAL DE META Y DESEMPEÑO (Adaptabilidad 100% Claro / Oscuro) */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-7 transition-all border shadow-lg bg-white border-slate-200/90 text-slate-800 dark:bg-[#0b1328] dark:border-[#162345] dark:text-slate-100">
        
        {/* Encabezado de la Tarjeta */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400 font-mono">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-sky-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span>Mi Desempeño en Campo</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-[#060a14] dark:text-slate-300 dark:border-[#1a2b50] font-mono">
            <Target className="w-3.5 h-3.5 text-blue-600 dark:text-sky-400" />
            <span>
              Meta: <strong>{displayMeta}</strong> obj.
            </span>
          </div>
        </div>

        {/* Cifras de Progreso */}
        <div className="flex items-baseline gap-2 mb-2">
          {loading && activeUserId ? (
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-sky-400 my-2" />
          ) : (
            <>
              <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {displayTotal}
              </span>
              <span className="text-2xl sm:text-3xl font-bold font-mono text-slate-400 dark:text-slate-600">
                / {displayMeta}
              </span>
            </>
          )}
        </div>

        {/* Resumen de Estado */}
        <div className="text-xs text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">
          {esSuperada ? (
            <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>
                <strong>¡Meta superada con éxito!</strong> Continúa registrando y fidelizando electores.
              </span>
            </p>
          ) : (
            <p>
              <span className="inline-block w-2 h-2 rounded-full mr-2 bg-amber-500 animate-pulse" />
              Avance del <strong className="text-slate-900 dark:text-white">{displayPorcentaje}%</strong> completado. Continuando captación y fidelización comunitaria.
            </p>
          )}
        </div>

        {/* Barra de Progreso */}
        <div className="space-y-1.5 mb-6">
          <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span>{displayPorcentaje}% completado</span>
            <span>{esSuperada ? '¡Objetivo alcanzado!' : `${restantes} restantes`}</span>
          </div>
          <div className="w-full h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-[#060a14] p-0.5 border border-slate-200/60 dark:border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                esSuperada
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-500 dark:to-sky-400'
              }`}
              style={{ width: `${Math.min(100, displayPorcentaje)}%` }}
            />
          </div>
        </div>

        {/* Botón CTA Principal */}
        <button
          type="button"
          onClick={onNavigateToRegister}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 active:scale-98 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Registrar Nuevo Elector Ahora</span>
          <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>

      {/* 2. GRID DE 2 TARJETAS SECUNDARIAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        
        {/* KPI: Con WhatsApp */}
        <div className="p-4 sm:p-5 rounded-2xl border transition-all bg-white border-slate-200/90 text-slate-800 dark:bg-[#0b1328] dark:border-[#162345] dark:text-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-mono">
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Phone className="w-3.5 h-3.5" />
            </div>
            <span>Con WhatsApp</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white block">
            {displayWithPhone}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Listos para fidelización
          </span>
        </div>

        {/* KPI: Puesto Principal */}
        <div className="p-4 sm:p-5 rounded-2xl border transition-all bg-white border-slate-200/90 text-slate-800 dark:bg-[#0b1328] dark:border-[#162345] dark:text-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-mono">
            <div className="p-1 rounded-md bg-blue-500/10 text-blue-600 dark:text-sky-400">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <span>Puesto Principal</span>
          </div>
          <span
            className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate block"
            title={displayTopPuesto}
          >
            {displayTopPuesto}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
            Concentración de sufragantes
          </span>
        </div>

      </div>

      {/* 3. BOTÓN DE ACCESO RÁPIDO A ELECTORES CONFIRMADOS */}
      <button
        type="button"
        onClick={handleNavigateToList}
        className="w-full p-4 sm:p-5 rounded-2xl border transition-all bg-white border-slate-200/90 hover:bg-slate-50 text-slate-800 dark:bg-[#0b1328] dark:border-[#162345] dark:hover:bg-[#101b38] dark:text-slate-100 flex items-center justify-between shadow-sm cursor-pointer active:scale-98 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
              Ver mis {displayTotal} electores confirmados
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              Revisar asignación de mesas y fidelización
            </span>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
      </button>

    </motion.div>
  );
};
