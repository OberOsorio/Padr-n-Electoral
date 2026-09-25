import React from 'react';
import {
  History,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Clock,
  Users,
  Shield,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import type { ExportLog } from '../../../types';

interface ExportHistoryTableProps {
  logs: ExportLog[];
  loading: boolean;
  onRefresh: () => void;
  className?: string;
}

export const ExportHistoryTable: React.FC<ExportHistoryTableProps> = ({
  logs,
  loading,
  onRefresh,
  className = '',
}) => {
  // Formateador de fecha en español (ej. "24 sep 2026, 01:45 PM")
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className={`rounded-2xl bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 shadow-xs dark:shadow-xl overflow-hidden transition-colors ${className}`}
    >
      {/* 1. Cabecera del Panel de Historial */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <History className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                Historial de Exportaciones y Auditoría
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700 text-[10px] font-mono text-slate-700 dark:text-slate-300 font-semibold">
                {logs.length} eventos
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Registro inmutable de descargas con trazabilidad por usuario, fecha y filtros aplicados.
            </p>
          </div>
        </div>

        {/* Botón de Refrescar */}
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-all shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
          title="Refrescar historial de auditoría"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* 2. Contenido de la Tabla */}
      {loading && logs.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <RefreshCw className="w-7 h-7 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Consultando registros de auditoría...
          </p>
        </div>
      ) : logs.length === 0 ? (
        /* Estado vacío */
        <div className="p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mx-auto">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              No hay exportaciones registradas aún
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Cada vez que generes o descargues un reporte en formato Excel o CSV, el evento quedará auditado en esta tabla.
            </p>
          </div>
        </div>
      ) : (
        /* Tabla con registros */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700/60 text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
              <tr>
                <th className="py-3 px-4">Fecha y Hora</th>
                <th className="py-3 px-4">Usuario Responsable</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">Formato</th>
                <th className="py-3 px-4">Registros</th>
                <th className="py-3 px-4">Filtros Aplicados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
              {logs.map((log) => {
                const isXlsx = log.export_format.toLowerCase() === 'xlsx';
                const initials = (log.user_name || 'U')
                  .trim()
                  .split(/\s+/)
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase();

                const isAdmin = log.user_role?.toLowerCase() === 'admin';

                return (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors"
                  >
                    {/* Fecha y Hora */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatDate(log.created_at)}</span>
                      </div>
                    </td>

                    {/* Usuario Responsable */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5 min-w-[180px]">
                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-semibold text-[10px] ring-1 ring-white/20 shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white truncate leading-tight">
                            {log.user_name}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                            {log.user_email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Rol */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-semibold border ${
                          isAdmin
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                        }`}
                      >
                        <Shield className="w-2.5 h-2.5" />
                        {log.user_role}
                      </span>
                    </td>

                    {/* Formato */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border uppercase tracking-wider ${
                          isXlsx
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                            : 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50'
                        }`}
                      >
                        {isXlsx ? (
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        )}
                        <span>{log.export_format.toUpperCase()}</span>
                      </span>
                    </td>

                    {/* Volumen */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span className="font-bold text-slate-900 dark:text-[#F8FAFC]">
                          {log.record_count.toLocaleString('es-CO')}
                        </span>
                        <span className="text-slate-400 text-[10px]">filas</span>
                      </div>
                    </td>

                    {/* Filtros Aplicados */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 max-w-[260px] sm:max-w-xs">
                        <Filter className="w-3 h-3 text-slate-400 shrink-0" />
                        <span
                          className="font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate"
                          title={log.filters_summary || 'Sin filtros específicos'}
                        >
                          {log.filters_summary || 'Territorio completo'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pie del Panel */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Políticas RLS activas en Supabase</span>
        </span>
        <span>Últimas {logs.length} descargas registradas</span>
      </div>
    </div>
  );
};
