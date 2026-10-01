import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  Target,
  ArrowRight,
  TrendingUp,
  Clock,
  Activity,
  RotateCw,
  Shield,
} from 'lucide-react';
import { useDashboardData } from './useDashboardData';
import { AnimatedCounter } from '../../components/ui/AnimatedCounter';
import { DateRangeSelector, type DateRangeOption } from './DateRangeSelector';
import { NotificationCenter } from './NotificationCenter';
import { TerritoryDistributionCard } from './TerritoryDistributionCard';
import { useTenant } from '../../context/TenantContext';

export interface DirectorDashboardViewProps {
  onNavigateToElectors?: (puestoFilter?: string) => void;
  onNavigateToRegister?: () => void;
  onNavigateToBulkUpload?: () => void;
  onNavigateToTeam?: () => void;
  userName?: string;
  tenantId?: string;
}

export const DirectorDashboardView: React.FC<DirectorDashboardViewProps> = React.memo(({
  onNavigateToElectors,
  onNavigateToRegister: _onNavigateToRegister,
  onNavigateToBulkUpload: _onNavigateToBulkUpload,
  onNavigateToTeam,
  userName = 'Alejandro Doria',
  tenantId,
}) => {
  const { currentTenant } = useTenant();
  const [selectedRange, setSelectedRange] = useState<DateRangeOption>('7days');
  const { data, refetch } = useDashboardData(tenantId, selectedRange);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const nombreCircunscripcion = currentTenant?.municipio
    ? `Campaña Municipal - ${currentTenant.municipio}`
    : currentTenant?.name || 'Campaña Municipal';

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // =========================================================================
  // 1. MÉTRICAS CONSOLIDADAS REALES (DashboardMetrics)
  // =========================================================================
  const totalRegistrados = data?.totalElectores ?? 0;
  const electoresActivos = data?.electoresActivos ?? 0;
  const lideresActivos = data?.lideresActivos ?? 0;
  const metaGlobal = data?.metaGlobal ?? 100;
  const avanceNumeric = data?.porcentajeAvance ?? 0;
  const avanceGlobalPct = (data?.porcentajeAvance ?? 0).toFixed(1).replace('.', ',');

  // Cálculo SVG del Donut de Avance (radio 34 -> circunferencia ~213.63)
  const donutRadius = 34;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const donutStrokeDashoffset =
    donutCircumference - (donutCircumference * Math.min(100, avanceNumeric)) / 100;

  // =========================================================================
  // 2. EVOLUCIÓN DE GESTIÓN (7 DÍAS REALES)
  // =========================================================================
  const trendDays = data?.evolucionSemanal && data.evolucionSemanal.length === 7
    ? data.evolucionSemanal
    : [
        { dia: 'Dom', total: 0 },
        { dia: 'Lun', total: 0 },
        { dia: 'Mar', total: 0 },
        { dia: 'Mié', total: 0 },
        { dia: 'Jue', total: 0 },
        { dia: 'Vie', total: 0 },
        { dia: 'Sáb', total: 0 },
      ];

  const maxCount = Math.max(...trendDays.map((d) => d.total), 5);
  const chartPoints = trendDays.map((d, index) => {
    const x = 42 + index * (420 / 6);
    const y = 110 - (d.total / maxCount) * 88;
    return { x, y, count: d.total, day: d.dia };
  });

  // Generador de curva SVG Spline suave con curvatura natural (Spline Monotone / Bezier)
  const splinePath = chartPoints.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[idx - 1];
    const dx = (pt.x - prev.x) * 0.45;
    return `${acc} C ${prev.x + dx},${prev.y} ${pt.x - dx},${pt.y} ${pt.x},${pt.y}`;
  }, '');

  const areaPath = chartPoints.length > 0
    ? `${splinePath} L ${chartPoints[chartPoints.length - 1].x},110 L ${chartPoints[0].x},110 Z`
    : '';

  const totalTrendElectores = trendDays.reduce((acc, d) => acc + d.total, 0);
  const avgTrendElectores = trendDays.length > 0 ? (totalTrendElectores / trendDays.length).toFixed(1) : '0';
  const picoTrendDia = trendDays.reduce((prev, curr) => (curr.total > prev.total ? curr : prev), trendDays[0] || { dia: '-', total: 0 });

  // =========================================================================
  // 3. ESTADO DEL EQUIPO (DONUT DE 3 SEGMENTOS CON DATOS REALES)
  // =========================================================================
  const teamTotal = data?.estadoEquipo?.total ?? 0;
  const teamActivos = data?.estadoEquipo?.activos ?? 0;
  const teamSinActividad = data?.estadoEquipo?.sinActividad ?? 0;
  const teamPendientes = data?.estadoEquipo?.pendientes ?? 0;

  const pctActivos = teamTotal > 0 ? Math.round((teamActivos / teamTotal) * 100) : 0;
  const pctSinActividad = teamTotal > 0 ? Math.round((teamSinActividad / teamTotal) * 100) : 0;
  const pctPendientes = teamTotal > 0 ? Math.round((teamPendientes / teamTotal) * 100) : 0;

  const donutTeamRadius = 38;
  const donutTeamCircumference = 2 * Math.PI * donutTeamRadius; // ~238.76

  const activosLen = teamTotal > 0 ? (teamActivos / teamTotal) * donutTeamCircumference : 0;
  const sinActividadLen = teamTotal > 0 ? (teamSinActividad / teamTotal) * donutTeamCircumference : 0;
  const pendientesLen = teamTotal > 0 ? (teamPendientes / teamTotal) * donutTeamCircumference : 0;

  // =========================================================================
  // 5. RENDIMIENTO DEL EQUIPO (TABLA REAL)
  // =========================================================================
  const tableMembers = (data?.rendimientoLideres || []).map((leader, idx) => {
    const nameParts = (leader.nombre || 'Líder').trim().split(' ');
    const initials = nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase()
      : (leader.nombre ? leader.nombre.substring(0, 2).toUpperCase() : 'LD');

    const avatarGradients = [
      'from-blue-600 to-cyan-500',
      'from-amber-500 to-amber-600',
      'from-blue-500 to-indigo-600',
      'from-purple-600 to-fuchsia-600',
      'from-emerald-500 to-teal-600',
    ];

    return {
      id: leader.id,
      name: leader.nombre,
      role: leader.rol,
      meta: leader.meta > 0 ? leader.meta.toLocaleString('es-CO') : '-',
      gestionados: leader.gestionados.toLocaleString('es-CO'),
      avance: `${leader.avance}%`,
      pctNumeric: leader.avance,
      status: leader.estado,
      initials,
      avatarGradient: avatarGradients[idx % avatarGradients.length],
    };
  });

  // =========================================================================
  // 6. ACTIVIDAD RECIENTE (ELECTORES REGISTRADOS EN TIEMPO REAL)
  // =========================================================================
  const actividadReciente = data?.actividadReciente || [];

  const activityBadges = [
    'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
    'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#060b17] text-slate-800 dark:text-slate-100 p-4 sm:p-6 lg:p-7 relative overflow-hidden select-none space-y-5 transition-colors duration-200">
      {/* 0. Halos de Iluminación Ambiental */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-20 right-1/4 w-[650px] h-[350px] bg-blue-500/5 dark:bg-blue-600/10 blur-[140px]" />
        <div className="absolute top-1/3 left-1/4 w-[550px] h-[350px] bg-cyan-400/5 dark:bg-cyan-500/5 blur-[130px]" />
        <div className="absolute bottom-10 right-1/3 w-[500px] h-[300px] bg-indigo-500/5 dark:bg-indigo-600/5 blur-[140px]" />
      </div>

      {/* =========================================================================
          1. BARRA SUPERIOR (HEADER & PERFIL DE MANDO)
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-[#15223e]">
        {/* Izquierda: Título y Subtítulo Institucional */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Panel de Control
            </h1>
            <button
              onClick={handleRefresh}
              title="Actualizar métricas en tiempo real"
              className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600 dark:text-cyan-400' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {userName} - Campaña Municipal
          </p>
        </div>

        {/* Derecha: Selector de Período, Notificaciones y Perfil */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto">
          {/* 1. Selector de Período Temporal Interactivo y Reactivo */}
          <DateRangeSelector
            value={selectedRange}
            onChange={(range) => setSelectedRange(range)}
          />

          <div className="flex items-center gap-2 sm:gap-3">
            {/* 2. Centro de Notificaciones en Tiempo Real con Badge Persistente */}
            <NotificationCenter
              notifications={data?.notifications}
            />

            {/* Badge de Usuario Activo */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-[#15223e]">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/40 text-white font-bold text-xs flex items-center justify-center shadow-[0_0_12px_rgba(37,99,235,0.3)] shrink-0">
                {userName
                  .split(' ')
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() || 'AD'}
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                  {userName}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Administrador
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. FILA SUPERIOR DE MÉTRICAS CLAVE (KPI ROW - 5 TARJETAS REALES)
          ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* KPI 1: Electores registrados */}
        <div className="rounded-2xl bg-white dark:bg-[#0a1224] border border-slate-200/90 dark:border-[#15223e] p-3.5 sm:p-5 shadow-xs dark:shadow-[0_8px_30px_rgba(56,189,248,0.03)] hover:border-slate-300 dark:hover:border-[#1d2f56] transition-all flex flex-col justify-between">
          <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">Electores registrados</span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              <AnimatedCounter value={totalRegistrados} />
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>{totalRegistrados > 0 ? 'En padrón' : '0'}</span>
            </span>
          </div>
        </div>

        {/* KPI 2: Electores activos */}
        <div className="rounded-2xl bg-white dark:bg-[#0a1224] border border-slate-200/90 dark:border-[#15223e] p-3.5 sm:p-5 shadow-xs dark:shadow-[0_8px_30px_rgba(56,189,248,0.03)] hover:border-slate-300 dark:hover:border-[#1d2f56] transition-all flex flex-col justify-between">
          <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">Electores activos</span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              <AnimatedCounter value={electoresActivos} />
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>{totalRegistrados > 0 ? `${Math.round((electoresActivos / totalRegistrados) * 100)}%` : '0%'}</span>
            </span>
          </div>
        </div>

        {/* KPI 3: Líderes activos */}
        <div className="rounded-2xl bg-white dark:bg-[#0a1224] border border-slate-200/90 dark:border-[#15223e] p-3.5 sm:p-5 shadow-xs dark:shadow-[0_8px_30px_rgba(56,189,248,0.03)] hover:border-slate-300 dark:hover:border-[#1d2f56] transition-all flex flex-col justify-between">
          <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 mb-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200 dark:border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">Líderes activos</span>
          </div>

          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              <AnimatedCounter value={lideresActivos} />
            </span>
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" />
              <span>{data?.totalLideres ?? 1} tot.</span>
            </span>
          </div>
        </div>

        {/* KPI 4: Meta global */}
        <div className="rounded-2xl bg-white dark:bg-[#0a1224] border border-slate-200/90 dark:border-[#15223e] p-3.5 sm:p-5 shadow-xs dark:shadow-[0_8px_30px_rgba(56,189,248,0.03)] hover:border-slate-300 dark:hover:border-[#1d2f56] transition-all flex flex-col justify-between">
          <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 mb-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold">Meta global</span>
          </div>

          <div className="mt-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              <AnimatedCounter value={metaGlobal} />
            </span>
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1.5 mb-1">
              <span>{avanceGlobalPct}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700"
                style={{ width: `${Math.min(100, avanceNumeric)}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 5: Avance Global (Donut Circular SVG) */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-1 rounded-2xl bg-white dark:bg-[#0a1224] border border-slate-200/90 dark:border-[#15223e] p-3.5 sm:p-5 shadow-xs dark:shadow-[0_8px_30px_rgba(56,189,248,0.03)] hover:border-slate-300 dark:hover:border-[#1d2f56] transition-all flex items-center justify-center">
          <div className="relative flex items-center justify-center">
            <svg className="w-24 h-24 -rotate-90 transform" viewBox="0 0 80 80">
              <defs>
                <linearGradient id="realAvanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00d2ff" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
              {/* Pista de fondo */}
              <circle
                cx="40"
                cy="40"
                r={donutRadius}
                fill="none"
                className="stroke-slate-100 dark:stroke-slate-800/60"
                strokeWidth="6.5"
              />
              {/* Anillo de progreso */}
              <circle
                cx="40"
                cy="40"
                r={donutRadius}
                fill="none"
                stroke="url(#realAvanceGradient)"
                strokeWidth="6.5"
                strokeDasharray={donutCircumference}
                strokeDashoffset={donutStrokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Texto Central */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Avance
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white leading-none mt-0.5">
                {avanceGlobalPct}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. FILA INTERMEDIA (EVOLUCIÓN, TERRITORIO Y ESTADO DEL EQUIPO)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        {/* COLUMNA 1: Evolución de gestión (Gráfico Spline SVG Real) */}
        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#0a1224] border border-slate-200/90 dark:border-[#162342] p-4 sm:p-5 shadow-lg flex flex-col justify-between h-[350px]">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#162342] mb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Evolución de gestión
              </h3>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/40 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400 animate-pulse" />
                Electores
              </span>
            </div>

            {/* Franja de Métricas de Resumen del Período */}
            <div className="flex items-baseline justify-between mb-1">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
                  {totalTrendElectores.toLocaleString('es-CO')}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  en este período
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40 font-mono">
                <TrendingUp className="w-3 h-3" />
                <span>↗ Pico: {picoTrendDia.dia} ({picoTrendDia.total})</span>
              </div>
            </div>

            {/* Área del Gráfico SVG Compacto */}
            <div className="relative w-full h-[145px]">
              <svg
                className="w-full h-full overflow-visible"
                viewBox="0 0 500 135"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="realChartAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                    <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.05" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Líneas Horizontales del Grid sutiles */}
                <line x1="40" y1="22" x2="470" y2="22" className="stroke-slate-200 dark:stroke-[#162342]" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="40" y1="66" x2="470" y2="66" className="stroke-slate-200 dark:stroke-[#162342]" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="40" y1="110" x2="470" y2="110" className="stroke-slate-300 dark:stroke-[#1e293b]" strokeWidth="1" />

                {/* Etiquetas Eje Y */}
                <text x="10" y="26" className="fill-slate-500 font-mono text-[10px]">{maxCount}</text>
                <text x="10" y="70" className="fill-slate-500 font-mono text-[10px]">{Math.round(maxCount / 2)}</text>
                <text x="25" y="114" className="fill-slate-500 font-mono text-[10px]">0</text>

                {/* Relleno con Degradado */}
                {areaPath && (
                  <path d={areaPath} fill="url(#realChartAreaGradient)" />
                )}

                {/* Línea Principal Spline */}
                {splinePath && (
                  <path
                    d={splinePath}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    className="drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]"
                  />
                )}

                {/* Puntos y Nodos */}
                {chartPoints.map((pt, idx) => (
                  <g key={idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={pt.count > 0 ? (pt.count === maxCount ? '4.5' : '3.5') : '2'}
                      className={pt.count === maxCount ? 'fill-sky-500 dark:fill-sky-400 stroke-white dark:stroke-[#0a1224]' : 'fill-white dark:fill-[#0a1224] stroke-sky-500 dark:stroke-sky-400'}
                      strokeWidth="2"
                    />
                    {pt.count > 0 && (
                      <text
                        x={pt.x}
                        y={pt.y - 7}
                        textAnchor="middle"
                        className="fill-sky-600 dark:fill-sky-400 font-bold font-mono text-[10px]"
                      >
                        {pt.count}
                      </text>
                    )}
                    {/* Etiquetas Eje X */}
                    <text
                      x={pt.x}
                      y="126"
                      textAnchor="middle"
                      className="fill-slate-400 font-medium text-[11px]"
                    >
                      {pt.day}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Pie de Tarjeta Armonizado */}
          <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-[#162342] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Promedio: <strong className="text-slate-800 dark:text-slate-200 font-mono">{avgTrendElectores}</strong> / día</span>
            </span>
            <span className="text-sky-400 font-semibold font-mono">
              {trendDays.length} días
            </span>
          </div>
        </div>

        {/* COLUMNA 2: Distribución por territorio (Puestos Reales y Dinámicos) */}
        <div className="lg:col-span-4 flex flex-col">
          <TerritoryDistributionCard
            puestos={data?.distribucionPuestos || []}
            nombreCircunscripcion={nombreCircunscripcion}
            onNavigateToElectorFilter={onNavigateToElectors}
          />
        </div>

        {/* COLUMNA 3: Estado del equipo (Donut Multi-Segmento Compacto) */}
        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#0a1224] border border-slate-200/90 dark:border-[#162342] p-4 sm:p-5 shadow-lg flex flex-col justify-between h-[350px]">
          <div>
            {/* Cabecera */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#162342] mb-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Estado del equipo
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#0d172e] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] font-mono">
                {teamTotal} {teamTotal === 1 ? 'Líder' : 'Líderes'}
              </span>
            </div>

            {/* Submétrica / KPI Strip: Nivel de despliegue operativo */}
            <div className="p-2.5 rounded-xl bg-slate-50/80 dark:bg-[#0d172e]/60 border border-slate-200/60 dark:border-[#162342] space-y-1 mb-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Despliegue operativo</span>
                <span className="font-bold text-emerald-400 font-mono">{pctActivos}% activo</span>
              </div>
              <div className="w-full bg-slate-200/80 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${pctActivos}%` }}
                />
              </div>
            </div>

            {/* Núcleo Visual: Donut SVG + Pills list en 2 columnas compactas */}
            <div className="flex items-center justify-between gap-4">
              {/* Donut Multi-Segmento SVG */}
              <div className="relative shrink-0 flex items-center justify-center">
                <svg className="w-24 h-24 sm:w-[102px] sm:h-[102px] -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Pista de fondo */}
                  <circle
                    cx="50"
                    cy="50"
                    r={donutTeamRadius}
                    fill="none"
                    className="stroke-slate-100 dark:stroke-slate-800/80"
                    strokeWidth="8"
                  />

                  {teamTotal > 0 ? (
                    <>
                      {/* Segmento 1: Activos (Verde) */}
                      {activosLen > 0 && (
                        <circle
                          cx="50"
                          cy="50"
                          r={donutTeamRadius}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="8"
                          strokeDasharray={`${activosLen} ${donutTeamCircumference}`}
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          className="transition-all duration-700"
                        />
                      )}

                      {/* Segmento 2: Sin actividad (Ámbar) */}
                      {sinActividadLen > 0 && (
                        <circle
                          cx="50"
                          cy="50"
                          r={donutTeamRadius}
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="8"
                          strokeDasharray={`${sinActividadLen} ${donutTeamCircumference}`}
                          strokeDashoffset={`-${activosLen}`}
                          strokeLinecap="round"
                          className="transition-all duration-700"
                        />
                      )}

                      {/* Segmento 3: Pendientes (Rojo/Rosa) */}
                      {pendientesLen > 0 && (
                        <circle
                          cx="50"
                          cy="50"
                          r={donutTeamRadius}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="8"
                          strokeDasharray={`${pendientesLen} ${donutTeamCircumference}`}
                          strokeDashoffset={`-${activosLen + sinActividadLen}`}
                          strokeLinecap="round"
                          className="transition-all duration-700"
                        />
                      )}
                    </>
                  ) : (
                    <circle
                      cx="50"
                      cy="50"
                      r={donutTeamRadius}
                      fill="none"
                      stroke="#94a3b8"
                      strokeWidth="8"
                      strokeDasharray="4 4"
                    />
                  )}
                </svg>

                {/* Centro del Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-black text-slate-900 dark:text-white leading-none">
                    {teamTotal}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider mt-0.5">
                    {teamTotal === 1 ? 'Líder' : 'Líderes'}
                  </span>
                </div>
              </div>

              {/* Leyenda con Pastillas Uniformes y Tipografía Fina */}
              <div className="flex-1 space-y-2 min-w-0">
                {/* Item 1: Activos */}
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0d172e] border border-slate-200/80 dark:border-[#162342]">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">Activos</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono shrink-0">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {teamActivos}
                    </span>
                    <span className="text-[10px] text-slate-400">({pctActivos}%)</span>
                  </div>
                </div>

                {/* Item 2: Sin actividad */}
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0d172e] border border-slate-200/80 dark:border-[#162342]">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)] shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">Sin actividad</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono shrink-0">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                      {teamSinActividad}
                    </span>
                    <span className="text-[10px] text-slate-400">({pctSinActividad}%)</span>
                  </div>
                </div>

                {/* Item 3: Pendientes */}
                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0d172e] border border-slate-200/80 dark:border-[#162342]">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.8)] shrink-0" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">Pendientes</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono shrink-0">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                      {teamPendientes}
                    </span>
                    <span className="text-[10px] text-slate-400">({pctPendientes}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pie de Tarjeta Armonizado */}
          <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-[#162342] flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Estructura de campaña</span>
            </span>
            {onNavigateToTeam && (
              <button
                type="button"
                onClick={onNavigateToTeam}
                className="text-blue-600 dark:text-cyan-400 hover:text-blue-700 dark:hover:text-cyan-300 font-semibold flex items-center gap-1 group transition-colors cursor-pointer"
              >
                <span>Ver equipo</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. FILA INFERIOR (RENDIMIENTO OPERATIVO Y ACTIVIDAD EN VIVO)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5">
        {/* BLOQUE IZQUIERDO: Rendimiento del equipo */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#0a1224] border border-slate-200/90 dark:border-[#15223e] p-4 sm:p-5 shadow-xs dark:shadow-[0_8px_30px_rgba(56,189,248,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#15223e]">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Rendimiento del equipo
            </h2>
            {onNavigateToTeam && (
              <button
                type="button"
                onClick={onNavigateToTeam}
                className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:text-blue-500 dark:hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Gestionar equipo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left text-xs min-w-[540px]">
              <thead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#15223e]">
                <tr>
                  <th className="py-2.5 px-3">Líder / Colaborador</th>
                  <th className="py-2.5 px-3">Rol</th>
                  <th className="py-2.5 px-3 text-center">Meta</th>
                  <th className="py-2.5 px-3 text-center">Gestionados</th>
                  <th className="py-2.5 px-3 text-center">Avance</th>
                  <th className="py-2.5 px-3 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#15223e]/60 font-medium">
                {tableMembers.length > 0 ? (
                  tableMembers.map((leader) => (
                    <tr key={leader.id} className="hover:bg-slate-50/80 dark:hover:bg-[#0e1830]/50 transition-colors">
                      {/* Líder / Colaborador */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${leader.avatarGradient} text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs`}
                          >
                            {leader.initials}
                          </div>
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {leader.name}
                          </span>
                        </div>
                      </td>

                      {/* Rol */}
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                        {leader.role}
                      </td>

                      {/* Meta */}
                      <td className="py-3 px-3 text-center font-mono text-slate-700 dark:text-slate-300">
                        {leader.meta}
                      </td>

                      {/* Gestionados */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {leader.gestionados}
                      </td>

                      {/* Avance con barra progresiva */}
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-cyan-500 dark:bg-cyan-400 transition-all duration-500"
                              style={{ width: `${leader.pctNumeric}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-white w-9 text-right">
                            {leader.avance}
                          </span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide ${
                            leader.status === 'ACTIVO'
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                              : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                          }`}
                        >
                          {leader.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      No hay colaboradores registrados para esta campaña.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BLOQUE DERECHO: Actividad reciente (Electores y eventos reales) */}
        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#0a1224] border border-slate-200/90 dark:border-[#15223e] p-4 sm:p-5 shadow-xs dark:shadow-[0_8px_30px_rgba(56,189,248,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#15223e]">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              Actividad reciente
            </h2>
            <button
              type="button"
              onClick={() => onNavigateToElectors?.()}
              className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:text-blue-500 dark:hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Ver todas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Timeline de Eventos Reales */}
          <div className="mt-3.5 space-y-3">
            {actividadReciente.length > 0 ? (
              actividadReciente.map((act, index) => (
                <div key={act.id || index} className="flex items-center gap-3">
                  {/* Hora fija Monospace */}
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 shrink-0 w-16">
                    {act.hora}
                  </span>

                  {/* Icono temático */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      activityBadges[index % activityBadges.length]
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                  </div>

                  {/* Descripción de la actividad */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-800 dark:text-slate-200 font-medium truncate">
                      {act.texto}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sin registros recientes
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[240px]">
                    Las inscripciones del padrón y novedades del equipo aparecerán aquí en vivo.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

DirectorDashboardView.displayName = 'DirectorDashboardView';

export const GeneralDashboardView = DirectorDashboardView;
export const DashboardView = DirectorDashboardView;
export default DirectorDashboardView;
