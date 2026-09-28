import React from 'react';
import type { DashboardTeamMember } from '../../../types';
import {
  Users,
  Shield,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Mail,
  UserX,
} from 'lucide-react';

interface OperativeTeamTableProps {
  members: DashboardTeamMember[];
  onNavigateToTeam?: () => void;
}

export const OperativeTeamTable: React.FC<OperativeTeamTableProps> = ({
  members,
  onNavigateToTeam,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800/80 shadow-sm overflow-hidden backdrop-blur-xl transition-colors">
      {/* Cabecera del Bloque */}
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
              <Users className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Efectividad de Líderes y Coordinadores
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Seguimiento en tiempo real de metas individuales y enrolamiento de electores.
          </p>
        </div>

        {onNavigateToTeam && (
          <button
            type="button"
            onClick={onNavigateToTeam}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/40 transition-all cursor-pointer self-start sm:self-center shrink-0 active:scale-[0.98]"
          >
            <span>Gestionar Equipo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Tabla Ejecutiva */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/75 dark:bg-slate-950/50 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <th className="py-3 px-4 sm:px-6">Líder / Colaborador</th>
              <th className="py-3 px-4">Rol Operativo</th>
              <th className="py-3 px-4 text-center">Electores Reportados</th>
              <th className="py-3 px-4 text-center">Meta Asignada</th>
              <th className="py-3 px-4 min-w-[160px]">Avance (%)</th>
              <th className="py-3 px-4 sm:px-6 text-center">Estado</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            {members.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <UserX className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-2" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-white">
                      No hay miembros registrados en la estructura operativa
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Asigne coordinadores y líderes desde el módulo de Equipo y Accesos.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              members.map((member) => {
                const isAdmin = member.role === 'admin';
                const initials = member.full_name
                  ? member.full_name
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                  : 'CO';

                const targetMeta = member.meta_electores && member.meta_electores > 0 ? member.meta_electores : 100;
                const count = member.totalElectores || 0;
                const pct = Math.round((count / targetMeta) * 100);
                const isReached = count >= targetMeta;
                const progressWidth = Math.min(100, pct);

                return (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* 1. Líder / Colaborador */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 border ${
                            isAdmin
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                              : member.role === 'lider'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                              : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-white truncate">
                            {member.full_name}
                          </p>
                          <span className="flex items-center gap-1.5 text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{member.email}</span>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Rol Operativo */}
                    <td className="py-3.5 px-4">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                          <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>Candidato / Dirección</span>
                        </span>
                      ) : member.role === 'coordinador' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/25">
                          <Shield className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span>Coordinador</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25">
                          <span>Líder</span>
                        </span>
                      )}
                    </td>

                    {/* 3. Electores Reportados */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700/60 shadow-2xs">
                        {count.toLocaleString()}
                      </span>
                    </td>

                    {/* 4. Meta Asignada */}
                    <td className="py-3.5 px-4 text-center font-mono text-xs">
                      {isAdmin ? (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          Sin cuota
                        </span>
                      ) : (
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {targetMeta.toLocaleString()}
                        </span>
                      )}
                    </td>

                    {/* 5. Avance (%) */}
                    <td className="py-3.5 px-4">
                      {isAdmin ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50">
                            Dirección General
                          </span>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-w-[200px]">
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {count} / {targetMeta}
                            </span>
                            <span
                              className={`text-[11px] font-bold ${
                                isReached
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              {pct}%
                            </span>
                          </div>

                          {/* Barra de progreso */}
                          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isReached
                                  ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50'
                                  : pct > 50
                                  ? 'bg-blue-600'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${progressWidth}%` }}
                            />
                          </div>

                          {/* Micro-badge si superó meta */}
                          {isReached && (
                            <div className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Meta Alcanzada</span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 6. Estado */}
                    <td className="py-3.5 px-4 sm:px-6 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wide border ${
                          member.is_active
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800/40'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            member.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                          }`}
                        />
                        {member.is_active ? 'Activo' : 'Suspendido'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
