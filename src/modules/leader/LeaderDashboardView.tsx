import React from 'react';
import {
  TrendingUp,
  Sliders,
  UserPlus,
  ArrowRight,
  Phone,
  MapPin,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface LeaderDashboardViewProps {
  stats: {
    total: number;
    goal: number;
    remaining: number;
    percentage: number;
    withPhone: number;
    topPuesto: string;
    topPuestoCount: number;
  };
  personalGoal: number;
  onOpenGoalModal: () => void;
  onNavigateToRegister: () => void;
  onNavigateToList: () => void;
}

export const LeaderDashboardView: React.FC<LeaderDashboardViewProps> = ({
  stats,
  personalGoal: _personalGoal,
  onOpenGoalModal,
  onNavigateToRegister,
  onNavigateToList,
}) => {
  return (
    <motion.div
      key="tab-goal"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Tarjeta Principal de Rendimiento Ejecutivo */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/80 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xs dark:shadow-xl relative overflow-hidden backdrop-blur-sm transition-colors">
        {/* Resplandor superior sutil en Azul Cobalto */}
        <div className="absolute top-0 right-0 w-52 h-52 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header de la Tarjeta */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Mi Desempeño en Campo
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenGoalModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
          >
            <Sliders className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Ajustar Meta</span>
          </button>
        </div>

        {/* Visualización de la Métrica Principal */}
        <div className="my-5">
          <div className="flex items-baseline">
            <span className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white tracking-tight font-sans">
              {stats.total}
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono text-base ml-2">
              / {stats.goal} objetivo
            </span>
          </div>

          {/* Texto de Desempeño Sobrio (Sin emojis) */}
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 mt-2.5 font-normal">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                stats.percentage >= 100
                  ? 'bg-emerald-500 dark:bg-emerald-400'
                  : stats.percentage >= 70
                  ? 'bg-blue-600 dark:bg-blue-400'
                  : 'bg-amber-500 dark:bg-amber-400'
              }`}
            />
            <p className="leading-relaxed">
              {stats.percentage >= 100
                ? 'Objetivo alcanzado. Censo personal al 100% de la capacidad programada.'
                : stats.percentage >= 70
                ? `Rendimiento óptimo: Faltan ${stats.remaining} electores para completar la cuota asignada.`
                : `Avance del ${stats.percentage}% completado. Continuando captación y fidelización comunitaria.`}
            </p>
          </div>
        </div>

        {/* Barra de Progreso Ultra Delgada y Moderna */}
        <div className="space-y-1.5 mt-5">
          <div className="flex justify-between text-xs font-mono font-medium">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">{stats.percentage}% completado</span>
            <span className="text-slate-500 dark:text-slate-400">{stats.remaining} restantes</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500 shadow-sm shadow-blue-500/20 transition-all duration-700"
              style={{ width: `${Math.min(100, stats.percentage)}%` }}
            />
          </div>
        </div>

        {/* Botón Primario de Acción Rápida */}
        <button
          type="button"
          onClick={onNavigateToRegister}
          className="mt-6 w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Registrar Nuevo Elector Ahora</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Tarjetas Secundarias de Métricas */}
      <div className="grid grid-cols-2 gap-3">
        {/* Con WhatsApp */}
        <div className="bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-900/60 dark:hover:bg-slate-850 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 transition-all shadow-2xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs font-medium">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Phone className="h-4 w-4" />
            </div>
            <span className="truncate">Con WhatsApp</span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-2">
            {stats.withPhone}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Listos para fidelización
          </p>
        </div>

        {/* Puesto Principal */}
        <div className="bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-900/60 dark:hover:bg-slate-850 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 transition-all shadow-2xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs font-medium">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <span className="truncate">Puesto Principal</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white mt-2 truncate" title={stats.topPuesto}>
            {stats.topPuesto}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
            {stats.topPuestoCount} electores ubicados
          </p>
        </div>
      </div>

      {/* Acceso Directo al Listado de Electores */}
      <button
        type="button"
        onClick={onNavigateToList}
        className="w-full p-4 rounded-xl bg-slate-50 hover:bg-slate-100/80 dark:bg-slate-900/60 dark:hover:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 transition-all cursor-pointer shadow-2xs"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Users className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-slate-900 dark:text-white">Ver mis {stats.total} electores confirmados</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Revisar asignación de mesas y fidelización</p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-400 dark:text-slate-500" />
      </button>
    </motion.div>
  );
};
