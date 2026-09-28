import React from 'react';
import { TrendingUp, UserPlus, ArrowRight, Target } from 'lucide-react';

export interface LeaderPerformanceCardProps {
  totalReportados: number;
  metaAsignada: number;
  onRegistrarClick: () => void;
}

export const LeaderPerformanceCard: React.FC<LeaderPerformanceCardProps> = ({
  totalReportados = 0,
  metaAsignada = 50,
  onRegistrarClick,
}) => {
  const porcentaje = metaAsignada > 0 ? Math.round((totalReportados / metaAsignada) * 100) : 0;
  const esSuperada = totalReportados >= metaAsignada;
  const restantes = Math.max(0, metaAsignada - totalReportados);
  const excedente = totalReportados - metaAsignada;

  return (
    <div className="relative w-full bg-gradient-to-b from-slate-900/95 via-slate-900/80 to-slate-950/95 border border-slate-800/80 border-t-2 border-t-blue-500/70 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl overflow-hidden group">
      {/* Resplandor ambiental de fondo */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Cabecera */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase font-mono">
            Mi Desempeño en Campo
          </span>
        </div>

        {/* Badge Informativo Seguro (Sin botón de edición) */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/70 border border-slate-700/60 text-xs font-mono text-slate-300 select-none shadow-inner">
          <Target className="w-3.5 h-3.5 text-blue-400" />
          <span>Meta: <strong className="text-white">{metaAsignada}</strong> obj.</span>
        </div>
      </div>

      {/* Cifra de Impacto */}
      <div className="flex items-baseline mb-3">
        <span className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white font-mono drop-shadow-sm">
          {totalReportados}
        </span>
        <span className="text-2xl sm:text-3xl text-slate-500 font-light font-mono ml-2">
          / {metaAsignada}
        </span>
      </div>

      {/* Subtexto descriptivo de rendimiento */}
      <div className="text-xs text-slate-400 flex items-center gap-2 mb-6">
        {esSuperada ? (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse shrink-0" />
            <span>
              <strong className="text-emerald-400">¡Meta superada con éxito!</strong> Continúe registrando electores; el censo permanece abierto.
            </span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400 shrink-0" />
            <span>
              Avance del <strong className="text-slate-200">{porcentaje}%</strong> completado. Continuando captación y fidelización comunitaria.
            </span>
          </>
        )}
      </div>

      {/* Métricas y Barra de Progreso */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className={`font-bold ${esSuperada ? 'text-emerald-400' : 'text-blue-400'}`}>
            {porcentaje}% completado
          </span>
          <span className="text-slate-400">
            {esSuperada ? `+${excedente} electores sobre la cuota` : `${restantes} restantes`}
          </span>
        </div>

        <div className="w-full h-2.5 bg-slate-800/80 rounded-full p-0.5 border border-slate-700/40 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              esSuperada
                ? 'bg-gradient-to-r from-emerald-500 to-teal-300 shadow-sm shadow-emerald-500/50'
                : 'bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 shadow-sm shadow-cyan-500/50'
            }`}
            style={{ width: `${Math.min(100, porcentaje)}%` }}
          />
        </div>
      </div>

      {/* Botón Principal de Acción */}
      <button
        type="button"
        onClick={onRegistrarClick}
        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-3 shadow-lg shadow-blue-600/30 hover:shadow-blue-500/50 active:scale-[0.99] transition-all cursor-pointer"
      >
        <UserPlus className="w-4 h-4" />
        <span>REGISTRAR NUEVO ELECTOR AHORA</span>
        <ArrowRight className="w-4 h-4 text-blue-200" />
      </button>
    </div>
  );
};
