import type { TeamMember } from '../../../types';
import { Award, Zap, TrendingUp } from 'lucide-react';

interface TopCoordinatorsCardProps {
  team: TeamMember[];
}

export const TopCoordinatorsCard = ({ team }: TopCoordinatorsCardProps) => {
  // Ordenar miembros por total de electores registrados descendente
  const sorted = [...team]
    .filter((m) => m.role === 'coordinador')
    .sort((a, b) => b.totalElectores - a.totalElectores)
    .slice(0, 3);

  const maxElectores = sorted[0]?.totalElectores || 1;

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 p-5 shadow-xs dark:shadow-xl">
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-[#E5B869]">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-800 dark:text-white">
              Ranking de Rendimiento Operativo
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-300">
              Coordinadores con mayor volumen de enrolamiento
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50 font-medium">
          <Zap className="w-3 h-3" />
          En Vivo
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {sorted.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-400 py-3 text-center font-mono">
            Sin coordinadores registrados aún
          </p>
        ) : (
          sorted.map((member, index) => {
            const percentage = Math.round((member.totalElectores / maxElectores) * 100);

            return (
              <div
                key={member.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`h-5 w-5 rounded-md text-[10px] font-mono font-bold flex items-center justify-center shrink-0 ${
                        index === 0
                          ? 'bg-amber-500/20 text-amber-700 dark:text-[#E5B869] border border-amber-500/40'
                          : index === 1
                          ? 'bg-slate-200 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      #{index + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                      {member.full_name}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-semibold text-slate-900 dark:text-[#F8FAFC]">
                      {member.totalElectores.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 ml-1">electores</span>
                  </div>
                </div>

                <div className="w-full bg-slate-200 dark:bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-[#E5B869] transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
        <span className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          Rendimiento consolidado
        </span>
        <span>Semana en curso</span>
      </div>
    </div>
  );
};
