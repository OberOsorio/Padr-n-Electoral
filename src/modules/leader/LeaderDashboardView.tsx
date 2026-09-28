import React from 'react';
import {
  Phone,
  MapPin,
  Users,
  ArrowRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LeaderPerformanceCard } from './LeaderPerformanceCard';

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
  personalGoal?: number;
  onNavigateToRegister: () => void;
  onNavigateToList: () => void;
}

/**
 * Limpia y normaliza cadenas crudas de puesto principal en el panel del líder
 */
function limpiarPuestoPrincipal(raw?: string): { titulo: string; detalle: string } {
  if (!raw || raw === '—' || raw === 'Sin datos') {
    return { titulo: 'Sin puesto registrado', detalle: 'Aún no hay electores' };
  }

  let text = raw.trim();
  let titulo = text;
  let detalle = '';

  if (text.includes(' - ') || text.includes(' – ') || text.includes(' — ')) {
    const parts = text.split(/\s*[-–—]\s*/);
    titulo = parts[0].trim();
    detalle = parts.slice(1).join(' • ').trim();
  } else if (text.includes(' / ')) {
    const parts = text.split(/\s*\/\s*/);
    titulo = parts[0].trim();
    detalle = parts.slice(1).join(' • ').trim();
  } else if (/\s+CGTO\b/i.test(text)) {
    const match = text.match(/^(.*?)\s+(CGTO\b.*)$/i);
    if (match) {
      titulo = match[1].trim();
      detalle = match[2].trim();
    }
  }

  titulo = titulo
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\bBONGO\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (/M\.?D\.?\s+CL\s+P\/?PAL/i.test(detalle)) {
    detalle = detalle.replace(/M\.?D\.?\s+CL\s+P\/?PAL/gi, '• Rural');
  }

  detalle = detalle
    .replace(/CGTO\b\.?/gi, 'Corregimiento')
    .replace(/VDA\b\.?/gi, 'Vereda')
    .replace(/P\/PAL|PPAL\b\.?/gi, 'Principal')
    .replace(/CAB\b\.?/gi, 'Cabecera')
    .replace(/\bBONGO\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (titulo && detalle.toLowerCase().includes(titulo.toLowerCase())) {
    detalle = detalle
      .replace(new RegExp(`\\b${titulo}\\b`, 'gi'), '')
      .replace(/\s*•\s*•\s*/g, ' • ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  detalle = detalle.replace(/^•\s*/, '').replace(/\s*•$/, '').trim();

  return {
    titulo: titulo || raw,
    detalle: detalle || 'Cabecera Municipal',
  };
}

export const LeaderDashboardView: React.FC<LeaderDashboardViewProps> = ({
  stats,
  personalGoal,
  onNavigateToRegister,
  onNavigateToList,
}) => {
  const puestoLimpio = limpiarPuestoPrincipal(stats.topPuesto);

  return (
    <motion.div
      key="tab-goal"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Tarjeta Principal de Rendimiento Ultra-Premium */}
      <LeaderPerformanceCard
        totalReportados={stats.total}
        metaAsignada={stats.goal || personalGoal || 50}
        onRegistrarClick={onNavigateToRegister}
      />

      {/* Tarjetas Secundarias de Métricas (100% Dark Glassmorphism) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Con WhatsApp */}
        <div className="bg-slate-900/60 hover:bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 transition-all shadow-xl backdrop-blur-sm group">
          <div className="flex items-center gap-2.5 text-slate-400 text-xs font-medium">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Phone className="h-4 w-4" />
            </div>
            <span className="truncate font-mono font-semibold uppercase text-[11px] tracking-wider text-slate-400">
              Con WhatsApp
            </span>
          </div>
          <p className="text-3xl font-extrabold text-white font-mono mt-3 tracking-tight">
            {stats.withPhone}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Listos para fidelización
          </p>
        </div>

        {/* Puesto Principal */}
        <div className="bg-slate-900/60 hover:bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 sm:p-5 transition-all shadow-xl backdrop-blur-sm group">
          <div className="flex items-center gap-2.5 text-slate-400 text-xs font-medium">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4" />
            </div>
            <span className="truncate font-mono font-semibold uppercase text-[11px] tracking-wider text-slate-400">
              Puesto Principal
            </span>
          </div>
          <p
            className="text-base sm:text-lg font-bold text-white mt-3 truncate tracking-tight"
            title={`${puestoLimpio.titulo} (${puestoLimpio.detalle})`}
          >
            {puestoLimpio.titulo}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-mono truncate" title={puestoLimpio.detalle}>
            {stats.topPuestoCount > 0
              ? `${stats.topPuestoCount} electores • ${puestoLimpio.detalle}`
              : puestoLimpio.detalle}
          </p>
        </div>
      </div>

      {/* Acceso Directo al Listado de Electores */}
      <button
        type="button"
        onClick={onNavigateToList}
        className="w-full p-4 sm:p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-900/80 border border-slate-800/80 hover:border-slate-700/80 flex items-center justify-between text-xs text-slate-300 transition-all cursor-pointer shadow-xl backdrop-blur-sm group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Users className="h-4 w-4" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-white text-sm">
              Ver mis {stats.total} electores confirmados
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Revisar asignación de mesas y fidelización
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
      </button>
    </motion.div>
  );
};
