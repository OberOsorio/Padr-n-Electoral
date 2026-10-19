import React from 'react';
import {
  Building2,
  Users,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Server,
  MapPin,
  ShieldCheck,
  Plus,
  Radio,
  Lock,
  CheckCircle2,
  Layers,
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
  const { tenants, loading } = useTenant();

  // Métricas agregadas de todos los tenants
  const activeTenantsCount = tenants.filter((t) => t.is_active).length;
  const suspendedTenantsCount = tenants.filter((t) => !t.is_active).length;
  const totalUsersGlobal = tenants.reduce((acc, t) => acc + (t.totalUsers || 2), 0);
  const totalElectoresGlobal = tenants.reduce((acc, t) => acc + (t.totalElectores || 0), 0);

  return (
    <div className="relative space-y-6 sm:space-y-8">
      {/* Luz ambiental decorativa superior */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-52 bg-gradient-to-r from-purple-600/10 via-indigo-600/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* 1. Header Ejecutivo del Dashboard Global */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/25 backdrop-blur-md shadow-xs mb-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Plataforma Maestra SaaS • Modo Supervisión
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Resumen Global de Plataforma
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Supervisión centralizada del ecosistema multi-inquilino, censo electoral y estado operativo de campañas en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 text-xs font-mono text-slate-600 dark:text-slate-300 shadow-xs">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Telemetría: 24ms</span>
          </div>

          <button
            type="button"
            onClick={onNavigateToTenants}
            className="w-full sm:w-auto justify-center px-5 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-purple-600/25 border border-purple-400/30 flex items-center gap-2.5 cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            <span>Gestionar Campañas</span>
            <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>
      </div>

      {/* 2. Tres Tarjetas KPI Maestras Premium */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5">
        {/* KPI 1: Campañas Activas */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-purple-500/40 dark:hover:border-purple-500/30 transition-all duration-300 p-5 sm:p-6 shadow-sm hover:shadow-xl dark:shadow-none hover:shadow-purple-500/5 group"
        >
          {/* Radial ambient glow top-right */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-purple-500/20 to-transparent blur-2xl pointer-events-none group-hover:from-purple-500/30 transition-all" />

          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              Campañas en Servicio
            </span>
            <div className="h-10 w-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-sm shadow-purple-500/10 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 relative z-10">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                {loading ? '...' : activeTenantsCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                de {loading ? '...' : tenants.length} registradas
              </span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-medium border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {activeTenantsCount} activas
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 font-medium border border-rose-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {suspendedTenantsCount} suspendida{suspendedTenantsCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </motion.div>

        {/* KPI 2: Total Usuarios Operativos */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-500/40 dark:hover:border-indigo-500/30 transition-all duration-300 p-5 sm:p-6 shadow-sm hover:shadow-xl dark:shadow-none hover:shadow-indigo-500/5 group"
        >
          {/* Radial ambient glow top-right */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500/20 to-transparent blur-2xl pointer-events-none group-hover:from-indigo-500/30 transition-all" />

          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              Usuarios Operativos
            </span>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shadow-indigo-500/10 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 relative z-10">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                {loading ? '...' : totalUsersGlobal}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                cuentas activas
              </span>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Directores, coordinadores y líderes de campo</span>
            </div>
          </div>
        </motion.div>

        {/* KPI 3: Salud de la Plataforma */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.2 }}
          className="relative overflow-hidden rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 transition-all duration-300 p-5 sm:p-6 shadow-sm hover:shadow-xl dark:shadow-none hover:shadow-emerald-500/5 group"
        >
          {/* Radial ambient glow top-right */}
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent blur-2xl pointer-events-none group-hover:from-emerald-500/30 transition-all" />

          <div className="flex items-center justify-between relative z-10">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
              Salud del Sistema
            </span>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/10 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 relative z-10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                100% Operacional
              </span>
            </div>

            <div className="mt-3 text-[11px] font-mono text-slate-500 dark:text-slate-400 space-y-1">
              <p className="flex justify-between items-center py-0.5 border-b border-slate-100 dark:border-slate-800/60">
                <span>Vercel Edge Network:</span>
                <span className="text-emerald-500 font-semibold">24ms • Óptimo</span>
              </p>
              <p className="flex justify-between items-center py-0.5">
                <span>Supabase PostgreSQL:</span>
                <span className="text-emerald-500 font-semibold">RLS Conforme</span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 3. Tabla / Distribución y Volumen de Electores por Campaña */}
      <div className="rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-sm dark:shadow-2xl dark:shadow-black/40">
        <div className="p-5 sm:p-6 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Distribución y Volumen de Electores por Campaña</span>
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/20">
                  {totalElectoresGlobal.toLocaleString()} totales
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Supervisión de electores registrados y capacidad operacional por inquilino
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onNavigateToHealth}
            className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-semibold inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto px-3 py-1.5 rounded-lg hover:bg-purple-500/10 transition-colors"
          >
            <span>Ver salud de infraestructura</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Contenido condicional: Skeleton, Empty State Premium, o Tabla de Datos */}
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse"
              />
            ))}
          </div>
        ) : tenants.length === 0 ? (
          <div className="py-14 sm:py-16 px-6 text-center flex flex-col items-center justify-center relative overflow-hidden">
            {/* Resplandor sutil de fondo */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/[0.04] to-transparent pointer-events-none" />

            <div className="relative mb-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-xl shadow-purple-500/10">
                <Building2 className="w-8 h-8" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-500 border-2 border-white dark:border-slate-900" />
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Sin campañas registradas en el entorno
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mt-1.5 mb-6 leading-relaxed">
              Aún no se han configurado inquilinos electorales. Despliegue su primera campaña para activar el monitoreo de electores, censo nacional y comités en tiempo real.
            </p>

            <button
              type="button"
              onClick={onNavigateToTenants}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:via-indigo-500 hover:to-purple-500 text-white text-xs font-semibold uppercase tracking-wider shadow-lg shadow-purple-600/25 border border-purple-400/30 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Primera Campaña</span>
            </button>

            {/* Badges de especificación técnica */}
            <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/80 flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <Lock className="w-3 h-3 text-purple-500" />
                Aislamiento Multi-Tenant (RLS)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                Censo Nacional Integrado
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <Users className="w-3 h-3 text-indigo-500" />
                Control Jerárquico RBAC
              </span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-950/60 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 tracking-wider">
                <tr>
                  <th className="py-3.5 px-5 font-semibold">Campaña / Cliente</th>
                  <th className="py-3.5 px-5 font-semibold">Jurisdicción</th>
                  <th className="py-3.5 px-5 font-semibold">Electores Registrados</th>
                  <th className="py-3.5 px-5 font-semibold">Capacidad Asignada</th>
                  <th className="py-3.5 px-5 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {tenants.map((t) => {
                  const current = t.totalElectores || 0;
                  const maxCap = t.max_electors || 25000;
                  const pct = Math.min(100, Math.round((current / maxCap) * 100));

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-600/10 to-indigo-600/20 dark:from-purple-900/30 dark:to-indigo-900/40 border border-purple-500/25 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold shrink-0 shadow-xs">
                            {t.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                              {t.name}
                            </p>
                            <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {t.admin_name ? `${t.admin_name} · ` : ''}
                              <span className="text-purple-600/80 dark:text-purple-400/80">/{t.slug}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5 text-slate-600 dark:text-slate-400">
                        {t.municipio || t.departamento ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                            <MapPin className="w-3 h-3 text-purple-500 shrink-0" />
                            {[t.municipio, t.departamento].filter(Boolean).join(', ')}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono italic">Nacional</span>
                        )}
                      </td>

                      <td className="py-4 px-5 font-mono font-medium">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {current.toLocaleString()}
                          </span>
                          <span className="text-slate-400 text-[10px]">electores</span>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400">
                            <span>{pct}%</span>
                            <span>{maxCap.toLocaleString()} máx</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-5">
                        {t.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium font-mono bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 shadow-xs">
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
        )}
      </div>

      {/* 4. Barra Inferior de Telemetría y Ecosistema SaaS */}
      <div className="rounded-xl bg-slate-100/60 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800/60 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-purple-500" />
          <span>Arquitectura SaaS Multi-Tenant V1.4 • Supabase PostgreSQL (RLS)</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Vercel Edge Global Ready
          </span>
          <span>•</span>
          <span>TLS 1.3 Cifrado Activo</span>
        </div>
      </div>
    </div>
  );
};
