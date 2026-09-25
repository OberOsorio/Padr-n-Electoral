import React from 'react';
import {
  Building2,
  Users,
  Database,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Server,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTenant } from '../../context/TenantContext';

interface MasterDashboardViewProps {
  onNavigateToTenants: () => void;
  onNavigateToHealth: () => void;
}

export const MasterDashboardView: React.FC<MasterDashboardViewProps> = ({
  onNavigateToTenants,
  onNavigateToHealth,
}) => {
  const { tenants } = useTenant();

  // Métricas agregadas de todos los tenants
  const activeTenantsCount = tenants.filter((t) => t.is_active).length;
  const suspendedTenantsCount = tenants.filter((t) => !t.is_active).length;
  const totalCapacity = tenants.reduce((acc, t) => acc + (t.max_electors || 0), 0);
  const totalElectorsGlobal = tenants.reduce((acc, t) => acc + (t.totalElectores || 0), 0);
  const totalUsersGlobal = tenants.reduce((acc, t) => acc + (t.totalUsers || 2), 0);
  const globalUtilizationPct = totalCapacity > 0 ? Math.round((totalElectorsGlobal / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Header del Dashboard Global */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Resumen Global de Plataforma
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Supervisión centralizada del ecosistema, distribución de cuotas y consumo de recursos
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onNavigateToTenants}
            className="w-full sm:w-auto justify-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:from-purple-700 active:to-indigo-700 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-purple-600/25 flex items-center gap-2 cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            <span>Gestionar Campañas</span>
          </button>
        </div>
      </div>

      {/* 2. Cuatro Tarjetas KPI Maestras */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
        {/* KPI 1: Campañas Activas */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase font-semibold text-slate-500 dark:text-slate-400">
              Campañas en Servicio
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Building2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {activeTenantsCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                de {tenants.length} registradas
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {activeTenantsCount} activas
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                {suspendedTenantsCount} suspendida{suspendedTenantsCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </motion.div>

        {/* KPI 2: Volumen Total de Electores Registrados */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase font-semibold text-slate-500 dark:text-slate-400">
              Censo Total Plataforma
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Database className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {totalElectorsGlobal.toLocaleString()}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              {totalCapacity.toLocaleString()} capacidad global contratada ({globalUtilizationPct}%)
            </p>
            {/* Barra de progreso global */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, globalUtilizationPct)}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* KPI 3: Total Usuarios Operativos */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase font-semibold text-slate-500 dark:text-slate-400">
              Usuarios Operativos
            </span>
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Users className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                {totalUsersGlobal}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                cuentas activas
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Directores y coordinadores de campo</span>
            </div>
          </div>
        </motion.div>

        {/* KPI 4: Salud de la Plataforma */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase font-semibold text-slate-500 dark:text-slate-400">
              Salud del Sistema
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Activity className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                100% Operacional
              </span>
            </div>
            <div className="mt-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 space-y-0.5">
              <p className="flex justify-between">
                <span>Cloudflare Edge:</span> <span className="text-emerald-500 font-semibold">24ms</span>
              </p>
              <p className="flex justify-between">
                <span>Supabase PostgreSQL:</span> <span className="text-emerald-500 font-semibold">RLS Conforme</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. Tabla de Consumo de Recursos por Campaña */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Consumo de Capacidad y Cuotas por Campaña</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Supervisión de electores registrados frente al tope contractual por inquilino
            </p>
          </div>

          <button
            type="button"
            onClick={onNavigateToHealth}
            className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Ver salud de infraestructura</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-[10px] font-mono uppercase text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Campaña / Cliente</th>
                <th className="py-3 px-4 font-semibold">Plan Contratado</th>
                <th className="py-3 px-4 font-semibold">Electores / Límite</th>
                <th className="py-3 px-4 font-semibold">Consumo de Cuota</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {tenants.map((t) => {
                const current = t.totalElectores || 0;
                const max = t.max_electors || 10000;
                const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
                const isNearLimit = pct >= 85;

                return (
                  <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-600/10 to-indigo-600/20 dark:from-purple-900/30 dark:to-indigo-900/40 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold shrink-0">
                          {t.name.slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">
                            {t.name}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                            {t.admin_name ? `${t.admin_name} · ` : ''}{t.slug}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.plan === 'enterprise'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60'
                          : t.plan === 'pro'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {t.plan}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                      <span className="font-bold text-slate-900 dark:text-white">{current.toLocaleString()}</span>
                      <span className="text-slate-500 dark:text-slate-400"> / {max.toLocaleString()}</span>
                    </td>

                    <td className="py-3.5 px-4 min-w-[180px]">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-mono">
                          <span className={isNearLimit ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-600 dark:text-slate-400'}>
                            {pct}% usado
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">{(max - current).toLocaleString()} restantes</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              pct >= 100
                                ? 'bg-rose-500'
                                : pct >= 85
                                ? 'bg-amber-500'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {t.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Activa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Suspendida
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
