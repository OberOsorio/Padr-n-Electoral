import { useMemo } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Download,
  Filter,
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  RotateCcw,
  Loader2,
  Layers,
  Database,
  Info,
  Clock,
} from 'lucide-react';
import { useReportData } from './useReportData';
import { useExportLogs } from './useExportLogs';
import { ExportHistoryTable } from './components/ExportHistoryTable';
import { generateReportFileName } from './reportGenerator';

interface ExportReportsViewProps {
  onNavigateToDashboard?: () => void;
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

export const ExportReportsView = ({
  onNavigateToDashboard,
  userName = 'Administrador General',
  userEmail = 'admin@electoral.gov',
  userRole = 'Admin',
}: ExportReportsViewProps) => {
  const { logs, loading: loadingLogs, refetchLogs, recordExport } = useExportLogs();

  const {
    filters,
    setFilters,
    totalMatching,
    previewRows,
    coordinatorsList,
    pollingPlacesList,
    loadingPreview,
    generating,
    downloadSuccessMessage,
    generateAndDownload,
  } = useReportData({
    onExportSuccess: ({ format, count, filtersSummary }) => {
      recordExport({
        userName,
        userEmail,
        userRole,
        recordCount: count,
        exportFormat: format,
        filtersSummary,
      });
    },
  });

  // Calcular mesas según el puesto seleccionado
  const availableMesas = useMemo(() => {
    if (filters.puesto === 'all') return [];
    const found = pollingPlacesList.find((p) => p.name === filters.puesto);
    if (!found) return [];
    return Array.from({ length: found.totalMesas }, (_, i) => i + 1);
  }, [filters.puesto, pollingPlacesList]);

  // Nombre de archivo proyectado
  const projectedFileName = useMemo(() => {
    return generateReportFileName(filters.puesto, filters.mesa, filters.format);
  }, [filters.puesto, filters.mesa, filters.format]);

  // Resetear filtros
  const handleResetFilters = () => {
    setFilters({
      puesto: 'all',
      mesa: 'all',
      startDate: '',
      endDate: '',
      coordinador: 'all',
      format: 'xlsx',
    });
  };

  // Atajos rápidos de fecha
  const handleSetDateShortcut = (daysAgo: number | null) => {
    if (daysAgo === null) {
      setFilters((prev) => ({ ...prev, startDate: '', endDate: '' }));
      return;
    }
    const today = new Date();
    const end = today.toISOString().slice(0, 10);
    const startObj = new Date(today);
    startObj.setDate(today.getDate() - daysAgo);
    const start = startObj.toISOString().slice(0, 10);

    setFilters((prev) => ({
      ...prev,
      startDate: start,
      endDate: end,
    }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 pb-24 md:pb-10 animate-in fade-in duration-300">
      {/* 1. Header Ejecutivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700/60 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span>Exportar Reportes del Padrón</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-stretch sm:self-auto">
          {onNavigateToDashboard && (
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white text-xs font-medium transition-all shadow-xs dark:shadow-none cursor-pointer"
            >
              Volver al Dashboard
            </button>
          )}

          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white text-xs font-medium transition-all shadow-xs dark:shadow-none cursor-pointer"
            title="Restablecer filtros a valores por defecto"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Restablecer</span>
          </button>
        </div>
      </div>

      {/* Alerta de Éxito al Descargar */}
      {downloadSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm animate-in slide-in-from-top-2 duration-300 shadow-lg backdrop-blur-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex-1 font-medium">{downloadSuccessMessage}</div>
        </div>
      )}

      {/* 2. Grid de Configuración (Filtros & Formato) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Panel Izquierdo: Configuración de Filtros (7 columnas) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-5 sm:p-7 shadow-xs dark:shadow-xl relative overflow-hidden backdrop-blur-md">
            <div className="flex items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Parámetros de Filtrado
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-300">
                    Delimita el alcance geográfico, temporal o por registrador.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {/* Filtro 1: Puesto de Votación */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Puesto de Votación</span>
                </label>
                <select
                  value={filters.puesto}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      puesto: e.target.value,
                      mesa: 'all', // Reset mesa al cambiar puesto
                    }))
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                >
                  <option value="all" className="bg-white dark:bg-slate-900">Todo el Territorio (Todos los puestos consolidados)</option>
                  {pollingPlacesList.map((place) => (
                    <option key={place.id} value={place.name} className="bg-white dark:bg-slate-900">
                      {place.name} ({place.totalMesas} mesas registradas)
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro 2: Mesa de Votación (dependiente del puesto) */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Mesa Específica</span>
                </label>
                <select
                  value={filters.mesa}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, mesa: e.target.value }))
                  }
                  disabled={filters.puesto === 'all'}
                  className={`w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 transition-all ${
                    filters.puesto === 'all'
                      ? 'opacity-50 cursor-not-allowed text-slate-400 dark:text-slate-500'
                      : 'cursor-pointer'
                  }`}
                >
                  <option value="all" className="bg-white dark:bg-slate-900">
                    {filters.puesto === 'all'
                      ? 'Disponible al seleccionar un puesto específico'
                      : 'Todas las Mesas del Puesto'}
                  </option>
                  {availableMesas.map((m) => (
                    <option key={m} value={m} className="bg-white dark:bg-slate-900">
                      Mesa #{m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro 3: Rango de Fechas */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Rango Temporal de Registro</span>
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                    <button
                      type="button"
                      onClick={() => handleSetDateShortcut(0)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      Hoy
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDateShortcut(7)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      7 días
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDateShortcut(30)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      30 días
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetDateShortcut(null)}
                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      Todo
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                      Desde:
                    </span>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                      Hasta:
                    </span>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) =>
                        setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                      className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Filtro 4: Coordinador / Registrador */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Coordinador o Registrador Asignado</span>
                </label>
                <select
                  value={filters.coordinador}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, coordinador: e.target.value }))
                  }
                  className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
                >
                  <option value="all" className="bg-white dark:bg-slate-900">Todos los miembros del equipo (Consolidado general)</option>
                  {coordinatorsList.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Selección de Formato & Generación (5 columnas) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
          {/* Tarjeta de Formato */}
          <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-5 sm:p-7 shadow-xs dark:shadow-xl backdrop-blur-md flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-200 dark:border-slate-700/60">
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-[#E5B869]">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Formato de Salida
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-300">
                    Elige el estándar de exportación para tu caso de uso.
                  </p>
                </div>
              </div>

              {/* Botones de Selección de Formato */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, format: 'xlsx' }))}
                  className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
                    filters.format === 'xlsx'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-white shadow-xs dark:shadow-lg ring-1 ring-blue-500'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {filters.format === 'xlsx' && (
                    <div className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 ring-4 ring-blue-100 dark:ring-blue-950" />
                  )}
                  <FileSpreadsheet
                    className={`w-6 h-6 mb-2 ${
                      filters.format === 'xlsx' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <div className="text-xs font-semibold uppercase tracking-wider font-mono">
                    Excel (.xlsx)
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    Hojas con ancho automático y formato nativo.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFilters((prev) => ({ ...prev, format: 'csv' }))}
                  className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
                    filters.format === 'csv'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-900 dark:text-white shadow-xs dark:shadow-lg ring-1 ring-blue-500'
                      : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {filters.format === 'csv' && (
                    <div className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 ring-4 ring-blue-100 dark:ring-blue-950" />
                  )}
                  <FileText
                    className={`w-6 h-6 mb-2 ${
                      filters.format === 'csv' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <div className="text-xs font-semibold uppercase tracking-wider font-mono">
                    CSV Estructurado
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                    UTF-8 BOM con delimitador ';' universal.
                  </div>
                </button>
              </div>

              {/* Resumen del Lote */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Registros a exportar:
                  </span>
                  <span className="font-mono font-bold text-slate-900 dark:text-[#F8FAFC] text-sm">
                    {loadingPreview ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin inline text-blue-600 dark:text-blue-400" />
                    ) : (
                      totalMatching.toLocaleString('es-CO')
                    )}
                  </span>
                </div>

                <div className="flex items-start justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-600 dark:text-slate-400 shrink-0">Nombre de archivo:</span>
                  <span className="font-mono text-[11px] text-amber-700 dark:text-[#E5B869] text-right truncate max-w-[210px] font-medium" title={projectedFileName}>
                    {projectedFileName}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-600 dark:text-slate-400">Codificación:</span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">
                    {filters.format === 'xlsx' ? 'OpenXML Binary UTF-8' : 'UTF-8 con BOM (;)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón de Acción Principal */}
            <div className="pt-6 mt-4 border-t border-slate-200 dark:border-slate-700/60">
              <button
                type="button"
                onClick={generateAndDownload}
                disabled={generating || totalMatching === 0 || loadingPreview}
                className={`w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-semibold tracking-wide flex items-center justify-center gap-2.5 transition-all shadow-xl cursor-pointer ${
                  generating || totalMatching === 0 || loadingPreview
                    ? 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white shadow-lg shadow-blue-500/20'
                }`}
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Compilando archivo y formateando...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-white" />
                    <span>
                      {totalMatching === 0
                        ? 'Sin registros para exportar'
                        : `Descargar ${filters.format.toUpperCase()} (${totalMatching} registros)`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sección de Vista Previa en Vivo (Live Sample Preview) */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-5 sm:p-7 shadow-xs dark:shadow-xl backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700/60">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Muestra Rápida de Datos a Exportar</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-300 mt-0.5">
              Visualización previa de los primeros 5 registros que conformarán el informe descargable.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 text-[11px] font-mono text-slate-700 dark:text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            <span>
              Total coincidente: <strong className="text-slate-900 dark:text-[#F8FAFC] font-bold">{totalMatching}</strong> registros
            </span>
          </div>
        </div>

        {/* Tabla de Preview */}
        {loadingPreview ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 dark:text-slate-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
            <span className="text-xs">Sincronizando registros con los filtros activos...</span>
          </div>
        ) : previewRows.length === 0 ? (
          <div className="py-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-dashed border-slate-300 dark:border-slate-700/60 text-center space-y-2">
            <Info className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
            <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">
              No se encontraron registros para los filtros seleccionados
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Intenta ampliar el rango de fechas, seleccionar todos los puestos o cambiar el registrador.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/60">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200 dark:border-slate-700/60 tracking-wider">
                <tr>
                  <th className="py-3 px-4">Documento</th>
                  <th className="py-3 px-4">Nombre Completo</th>
                  <th className="py-3 px-4">Teléfono</th>
                  <th className="py-3 px-4">Puesto Asignado</th>
                  <th className="py-3 px-4 text-center">Mesa</th>
                  <th className="py-3 px-4">Registrado Por</th>
                  <th className="py-3 px-4">Fecha de Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
                {previewRows.map((elector) => (
                  <tr key={elector.id} className="hover:bg-slate-100/60 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-[#F8FAFC]">
                      {elector.cedula}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 dark:text-white">
                      {elector.nombres} {elector.apellidos}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400">
                      {elector.telefono || <span className="text-slate-400 dark:text-slate-500 italic">N/A</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-200 max-w-[200px] truncate" title={elector.puesto_votacion}>
                      {elector.puesto_votacion}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
                        M-{elector.mesa || 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                      {elector.registrador?.full_name || 'Personal Autorizado'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {new Date(elector.created_at).toLocaleDateString('es-CO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <p>
            * El archivo final contendrá <span className="text-slate-700 dark:text-[#F8FAFC] font-semibold">{totalMatching}</span> registros con todas las columnas formateadas para auditoría electoral.
          </p>
          <span className="font-mono text-slate-500 dark:text-slate-400">Padrón Electoral Oficial</span>
        </div>
      </div>

      {/* 4. Historial de Exportaciones y Auditoría */}
      <ExportHistoryTable
        logs={logs}
        loading={loadingLogs}
        onRefresh={refetchLogs}
      />
    </div>
  );
};
