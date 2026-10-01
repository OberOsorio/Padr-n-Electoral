import React from 'react';
import type { DashboardTeamMember } from '../../../types';
import {
  Users,
  Shield,
  Crown,
  ArrowRight,
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
    <div className="rounded-2xl bg-white dark:bg-[#0C152B]/90 border border-slate-200 dark:border-blue-500/20 backdrop-blur-2xl shadow-sm dark:shadow-xl overflow-hidden transition-colors">
      {/* Header de la Tabla */}
      <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Efectividad de Líderes y Coordinadores
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Seguimiento en tiempo real de metas individuales y enrolamiento de electores.
            </p>
          </div>
        </div>

        {onNavigateToTeam && (
          <button
            type="button"
            onClick={onNavigateToTeam}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-bold text-blue-600 dark:text-cyan-300 hover:text-blue-700 dark:hover:text-white transition-all flex items-center gap-2 self-start sm:self-auto cursor-pointer"
          >
            <span>Gestionar Equipo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Contenedor de la Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[750px]">
          <thead className="bg-slate-100/80 dark:bg-[#091022] text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-white/5">
            <tr>
              <th className="py-4 px-6">Líder / Colaborador</th>
              <th className="py-4 px-6">Rol Operativo</th>
              <th className="py-4 px-6 text-center">Electores Reportados</th>
              <th className="py-4 px-6 text-center">Meta Asignada</th>
              <th className="py-4 px-6 min-w-[150px]">Avance (%)</th>
              <th className="py-4 px-6 text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium text-slate-600 dark:text-slate-300">
            {members.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-14 text-center">
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
                const isAdmin = member.role === 'admin' || member.role === ('superadmin' as any);
                const isCoordinador = member.role === 'coordinador';

                const initials = member.full_name
                  ? member.full_name
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                  : 'CO';

                const targetMeta =
                  member.meta_electores && member.meta_electores > 0 ? member.meta_electores : 100;
                const count = member.totalElectores || 0;
                const pct = Math.round((count / targetMeta) * 100);
                const progressWidth = Math.min(100, pct);

                return (
                  <tr key={member.id} className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors">
                    {/* Líder / Colaborador */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                            isAdmin
                              ? 'bg-gradient-to-br from-amber-500/20 to-orange-600/30 border border-amber-500/30 text-amber-600 dark:text-amber-400'
                              : 'bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400'
                          }`}
                        >
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm truncate">
                            {member.full_name}
                          </div>
                          <div className="text-slate-500 text-[11px] truncate">{member.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Rol Operativo */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {isAdmin ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px] font-bold">
                          <Crown className="w-3 h-3" />
                          <span>CANDIDATO / DIRECCIÓN</span>
                        </span>
                      ) : isCoordinador ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-700 dark:text-blue-400 text-[11px] font-bold">
                          <Shield className="w-3 h-3" />
                          <span>COORDINADOR</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-700 dark:text-cyan-400 text-[11px] font-bold">
                          <Shield className="w-3 h-3" />
                          <span>LÍDER</span>
                        </span>
                      )}
                    </td>

                    {/* Electores Reportados */}
                    <td className="py-4 px-6 text-center font-bold text-slate-900 dark:text-white text-sm">
                      {count.toLocaleString()}
                    </td>

                    {/* Meta Asignada */}
                    <td className="py-4 px-6 text-center">
                      {isAdmin ? (
                        <span className="text-slate-400 dark:text-slate-500 text-xs">Sin cuota</span>
                      ) : (
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-xs font-mono">
                          {targetMeta.toLocaleString()}
                        </span>
                      )}
                    </td>

                    {/* Avance (%) */}
                    <td className="py-4 px-6 min-w-[140px]">
                      {isAdmin ? (
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-[11px]">
                          Dirección General
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium font-mono">
                            <span>
                              {count} / {targetMeta}
                            </span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full transition-all duration-500"
                              style={{ width: `${progressWidth}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          member.is_active
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            member.is_active ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-rose-500'
                          }`}
                        />
                        <span>{member.is_active ? 'ACTIVO' : 'INACTIVO'}</span>
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

export default OperativeTeamTable;
