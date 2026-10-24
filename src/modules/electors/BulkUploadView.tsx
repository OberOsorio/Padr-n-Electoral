import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  RotateCcw,
  Download,
  Layers,
  Database,
  Loader2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBulkUpload } from './bulk/useBulkUpload';

interface BulkUploadViewProps {
  onNavigateToElectors?: () => void;
  onNavigateToDashboard?: () => void;
}

const springTransition = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 30,
  mass: 0.8,
};

export const BulkUploadView: React.FC<BulkUploadViewProps> = ({
  onNavigateToElectors,
  onNavigateToDashboard,
}) => {
  const {
    file,
    preflight,
    progress,
    postSummary,
    collisionMode,
    setCollisionMode,
    processFile,
    startBatchImport,
    resetUpload,
    downloadOfficialTemplate,
    downloadErrorsReport,
  } = useBulkUpload();

  const [isDragging, setIsDragging] = useState(false);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manejo de Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      processFile(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleReset = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    resetUpload();
  };

  const isUploading = progress.status === 'uploading';
  const isEnriching = progress.status === 'enriching';
  const isCompleted = progress.status === 'completed';
  const isReady = progress.status === 'ready' && preflight && preflight.validRows.length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 pb-24 md:pb-12 text-slate-800 dark:text-zinc-100">
      {/* 1. Header Ejecutivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/[0.07] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-zinc-400 font-semibold">
              Ingesta & Validación Masiva
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span>Carga Masiva de Electores</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Importación por lotes de 1.000 registros, deduplicación en memoria y enriquecimiento con el Censo Maestro.
          </p>
        </div>

        {/* Acciones del Header */}
        <div className="flex items-center gap-2 sm:gap-3 self-stretch sm:self-auto relative">
          {onNavigateToDashboard && (
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#121215] hover:dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-all shadow-xs active:scale-[0.98] cursor-pointer"
            >
              Dashboard
            </button>
          )}

          {/* Menú de Plantilla Oficial */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-950/40 hover:dark:bg-blue-900/40 border border-blue-200 dark:border-blue-500/25 text-blue-700 dark:text-blue-400 text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Plantilla</span>
              <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" style={{ transform: showTemplateMenu ? 'rotate(180deg)' : 'none' }} />
            </button>

            <AnimatePresence>
              {showTemplateMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={springTransition}
                  className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.1] shadow-2xl z-50 p-1.5 space-y-1 backdrop-blur-xl"
                >
                  <button
                    type="button"
                    onClick={() => {
                      downloadOfficialTemplate('xlsx');
                      setShowTemplateMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Plantilla Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      downloadOfficialTemplate('csv');
                      setShowTemplateMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-zinc-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span>Plantilla CSV (.csv UTF-8)</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Input oculto de archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* 2. Estado Completado: Reporte Post-Carga */}
      {isCompleted && postSummary && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className="rounded-2xl bg-white dark:bg-[#121215] border border-emerald-300 dark:border-emerald-500/30 p-6 sm:p-8 shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <CheckCircle2 className="w-48 h-48 text-emerald-400" />
          </div>

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold">
                  Operación Completada
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Carga Masiva Exitosa
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
              El archivo <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{postSummary.fileName}</span> fue procesado e integrado al padrón electoral central sin interrupciones.
            </p>

            {/* Grid de Métricas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.07]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                  Electores Ingresados
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {postSummary.successful.toLocaleString('es-CO')}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.07]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                  Filas Omitidas / Errores
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1 block">
                  {postSummary.skipped.toLocaleString('es-CO')}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.07]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                  Tiempo Total
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-800 dark:text-zinc-100 mt-1 block">
                  {(postSummary.durationMs / 1000).toFixed(1)}s
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.07]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                  Velocidad
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-1 block">
                  {postSummary.durationMs > 0
                    ? Math.round((postSummary.totalProcessed / (postSummary.durationMs / 1000)))
                    : postSummary.totalProcessed} reg/s
                </span>
              </div>
            </div>

            {/* Botones de Acción Posterior */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200 dark:border-white/[0.07]">
              {onNavigateToElectors && (
                <button
                  type="button"
                  onClick={onNavigateToElectors}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 active:scale-[0.98] cursor-pointer"
                >
                  <span>Explorar Padrón de Electores</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {postSummary.errors > 0 && (
                <button
                  type="button"
                  onClick={downloadErrorsReport}
                  className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/30 hover:border-amber-300 dark:hover:border-amber-500/50 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Reporte de Rechazos ({postSummary.errors})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#18181b] hover:dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ml-auto shadow-xs active:scale-[0.98]"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Cargar Otro Archivo</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 3. Zona Drag & Drop (Si no se ha cargado o está en estado inicial) */}
      {!file && !isCompleted && (
        <motion.div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          whileHover={{ scale: 1.002 }}
          transition={springTransition}
          className={`rounded-2xl border-2 border-dashed transition-all p-10 sm:p-16 text-center cursor-pointer relative overflow-hidden group ${
            isDragging
              ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/20 shadow-lg dark:shadow-[0_0_20px_rgba(59,130,246,0.15)]'
              : 'border-slate-300 dark:border-white/[0.12] bg-white dark:bg-[#121215] hover:border-slate-400 dark:hover:border-white/[0.22] hover:bg-slate-50/60 dark:hover:bg-[#151518]'
          }`}
        >
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-100 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 group-hover:border-blue-500/40 transition-all shadow-xs">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div>
              <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                Arrastra tu archivo aquí o <span className="text-blue-600 dark:text-blue-400 underline underline-offset-4">haz clic para examinar</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                Formatos compatibles: <strong className="text-slate-700 dark:text-zinc-200 font-mono">.xlsx, .xls, .csv</strong> (delimitado por coma o punto y coma)
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-4 text-[11px] font-mono text-slate-400 dark:text-zinc-500">
              <span>Máx. 50.000 registros</span>
              <span>•</span>
              <span>Cálculo automático de edad</span>
              <span>•</span>
              <span>Deduplicación activa</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* 4. Spinner de Parsing inicial o Validación */}
      {(progress.status === 'parsing' || progress.status === 'validating') && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className="p-8 rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] text-center space-y-3 shadow-xs"
        >
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
          <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
            {progress.currentChunkMessage}
          </p>
          <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
            Analizando estructura tabular y deduplicando documentos...
          </p>
        </motion.div>
      )}

      {/* 4.1 Barra de Progreso de Enriquecimiento y Consulta al Censo */}
      {isEnriching && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#121215] border border-indigo-200 dark:border-indigo-500/30 text-center space-y-5 shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5 text-left">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 shadow-xs shrink-0">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Autocompletando con Censo Maestro</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                    RPC Lote
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                  {progress.currentChunkMessage}
                </p>
              </div>
            </div>

            <div className="font-mono tabular-nums text-lg sm:text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {progress.percentage}%
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-2.5 w-full bg-slate-100 dark:bg-[#18181b] rounded-full overflow-hidden border border-slate-200 dark:border-white/[0.08] p-0.5 relative">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-blue-600 to-emerald-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={springTransition}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
              <span>Separación léxica de nombres compuestos + Puesto y Mesa</span>
              <span className="tabular-nums">{progress.processed.toLocaleString('es-CO')} / {progress.totalToUpload.toLocaleString('es-CO')} verificadas</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Alerta de Error */}
      {progress.status === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 space-y-4"
        >
          <div className="flex items-center gap-3">
            <XCircle className="w-6 h-6 text-rose-500 dark:text-rose-400 shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                Error al procesar el archivo
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300/90 mt-0.5">
                {progress.errorMessage || 'Verifica que el archivo no esté corrupto o protegido por contraseña.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 border border-rose-300 dark:border-rose-500/40 text-xs font-semibold text-rose-900 dark:text-rose-100 transition-colors cursor-pointer active:scale-[0.98]"
          >
            Intentar con otro archivo
          </button>
        </motion.div>
      )}

      {/* 5. Pre-flight Validation Summary & Configuración */}
      {preflight && !isCompleted && progress.status !== 'uploading' && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className="space-y-6"
        >
          {/* Ficha Resumen del Archivo y Columnas Detectadas */}
          <div className="rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.07] p-5 sm:p-7 shadow-xs dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400 shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-mono">
                    {preflight.fileName}
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                    {(preflight.fileSize / 1024).toFixed(1)} KB • {preflight.totalRawRows} filas totales en origen
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-[#18181b] hover:dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cambiar Archivo</span>
                </button>

                <button
                  type="button"
                  onClick={startBatchImport}
                  disabled={!isReady}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer ${
                    isReady
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20 active:scale-[0.98]'
                      : 'bg-slate-100 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.06] text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Guardar e Importar ({preflight.validRows.length.toLocaleString('es-CO')})</span>
                </button>
              </div>
            </div>

            {/* Banner de Acción Rápida */}
            <div className="my-4 p-4 rounded-xl bg-blue-50/70 dark:bg-[#18181b] border border-blue-200 dark:border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-blue-900 dark:text-blue-300">
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-semibold">
                    Archivo listo para guardar: {preflight.validRows.length.toLocaleString('es-CO')} electores válidos
                  </p>
                  <p className="text-[11px] text-blue-700/80 dark:text-zinc-400 mt-0.5">
                    Haga clic en el botón <strong className="text-blue-800 dark:text-blue-300">&quot;Guardar e Importar&quot;</strong> para sincronizar los registros con el padrón electoral central.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={startBatchImport}
                disabled={!isReady}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 cursor-pointer shrink-0 active:scale-[0.98]"
              >
                <span>Guardar Ahora</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* KPI Cards de Auditoría */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.07]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                  Filas Válidas para Inserción
                </span>
                <span className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {preflight.validRows.length.toLocaleString('es-CO')}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5 block">
                  Cumplen con cédula, nombres y estructura
                </span>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-[#18181b] border border-indigo-200/80 dark:border-indigo-500/20">
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-700 dark:text-indigo-400 font-semibold flex items-center justify-between">
                  <span>Verificados / Censo</span>
                  {preflight.isEnrichingInProgress && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  )}
                </span>
                <span className="text-2xl font-bold font-mono tabular-nums text-indigo-700 dark:text-indigo-300 mt-1 block">
                  {(preflight.enrichedCount || 0).toLocaleString('es-CO')}
                </span>
                <span className="text-[10px] text-indigo-600/90 dark:text-zinc-400 mt-0.5 block">
                  {preflight.correctedCount && preflight.correctedCount > 0
                    ? `${preflight.correctedCount} corregidos por Censo`
                    : 'Identidad y edad auditadas en tiempo real'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.07]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                  Filas con Inconsistencias
                </span>
                <span className={`text-2xl font-bold font-mono tabular-nums mt-1 block ${
                  preflight.invalidRows.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-zinc-600'
                }`}>
                  {preflight.invalidRows.length.toLocaleString('es-CO')}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5 block">
                  {preflight.duplicateCedulasInFile > 0
                    ? `${preflight.duplicateCedulasInFile} duplicados internos en el archivo`
                    : 'Serán omitidas del procesamiento'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.07]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 block">
                  Lotes Estimados (Chunks)
                </span>
                <span className="text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-1 block">
                  {Math.ceil(preflight.validRows.length / 1000)}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5 block font-mono">
                  1.000 registros por llamada de red
                </span>
              </div>
            </div>

            {/* Columnas Reconocidas */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.07]">
              <span className="text-[11px] font-mono text-slate-600 dark:text-zinc-400 uppercase tracking-wider block mb-2 font-semibold">
                Mapeo Automático de Columnas Reconocidas:
              </span>
              <div className="flex flex-wrap gap-2">
                {preflight.detectedColumns.map((col, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-[11px] font-mono text-slate-700 dark:text-zinc-300"
                  >
                    <span className="text-slate-500 dark:text-zinc-500">{col.original}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">➔</span>
                    <strong className="text-blue-700 dark:text-blue-300">{col.mappedTo}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Política de Colisión de Registros */}
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/[0.07]">
              <label className="text-xs font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono block mb-3">
                Política de Manejo de Duplicados en Base de Datos:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    collisionMode === 'skip'
                      ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-300 dark:border-blue-500/40 ring-1 ring-blue-400/20 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-[#18181b] border-slate-200 dark:border-white/[0.07] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="collision"
                    checked={collisionMode === 'skip'}
                    onChange={() => setCollisionMode('skip')}
                    className="mt-0.5 accent-blue-600 dark:accent-blue-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <strong className="block text-slate-900 dark:text-white font-medium">
                      Omitir registros existentes (Recomendado)
                    </strong>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 block leading-relaxed">
                      Si la cédula ya se encuentra en la base de datos, se conserva intacta sin sobreescribir su puesto ni mesa.
                    </span>
                  </div>
                </label>

                <label
                  className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    collisionMode === 'upsert'
                      ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-300 dark:border-blue-500/40 ring-1 ring-blue-400/20 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-[#18181b] border-slate-200 dark:border-white/[0.07] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="collision"
                    checked={collisionMode === 'upsert'}
                    onChange={() => setCollisionMode('upsert')}
                    className="mt-0.5 accent-blue-600 dark:accent-blue-500 cursor-pointer"
                  />
                  <div className="text-xs">
                    <strong className="block text-slate-900 dark:text-white font-medium">
                      Actualizar datos existentes (Upsert)
                    </strong>
                    <span className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 block leading-relaxed">
                      Sobrescribe los datos de electores existentes con la nueva información de puesto y teléfono provista en este archivo.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Vista Previa de Filas Válidas */}
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-white/[0.07]">
              {/* Barra e Indicador de Progreso Dinámico de Consultas en Segundo Plano */}
              {preflight.isEnrichingInProgress && (
                <div className="mb-4 p-3.5 rounded-xl bg-blue-50/70 dark:bg-[#18181b] border border-blue-200 dark:border-blue-500/20 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-mono mb-2">
                    <span className="font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                      Consultando censo oficial y calculando edades: {(preflight.enrichmentProgress?.processed || 0).toLocaleString('es-CO')} / {preflight.validRows.length.toLocaleString('es-CO')} ({Math.round(((preflight.enrichmentProgress?.processed || 0) / (preflight.validRows.length || 1)) * 100)}%)...
                    </span>
                    <span className="font-bold tabular-nums text-blue-800 dark:text-blue-200">
                      {Math.round(((preflight.enrichmentProgress?.processed || 0) / (preflight.validRows.length || 1)) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-200/60 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-200 ease-out"
                      style={{
                        width: `${Math.min(100, Math.round(((preflight.enrichmentProgress?.processed || 0) / (preflight.validRows.length || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 uppercase tracking-wider font-mono">
                    Muestra Preliminar (Primeras 5 filas a procesar):
                  </span>
                  {!preflight.isEnrichingInProgress && (preflight.enrichedCount || 0) > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30">
                      <Sparkles className="w-3 h-3" />
                      Censo verificado: {preflight.enrichedCount} confirmados{preflight.correctedCount ? `, ${preflight.correctedCount} corregidos` : ''}
                    </span>
                  )}
                </div>
                {preflight.invalidRows.length > 0 && (
                  <button
                    type="button"
                    onClick={downloadErrorsReport}
                    className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Descargar {preflight.invalidRows.length} filas con error</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/[0.07] bg-white dark:bg-[#18181b] shadow-xs w-full">
                <table className="w-full text-left text-xs min-w-[680px]">
                  <thead className="bg-slate-50 dark:bg-white/[0.02] text-slate-500 dark:text-zinc-400 font-mono text-[10px] uppercase border-b border-slate-200 dark:border-white/[0.07] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Cédula</th>
                      <th className="py-2.5 px-3">Nombre Completo</th>
                      <th className="py-2.5 px-3 text-center">Edad</th>
                      <th className="py-2.5 px-3">Teléfono</th>
                      <th className="py-2.5 px-3">Puesto Asignado</th>
                      <th className="py-2.5 px-3 text-center">Mesa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/[0.07] text-slate-700 dark:text-zinc-300">
                    {preflight.validRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold tabular-nums text-slate-900 dark:text-zinc-100">
                          {row.cedula}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-slate-800 dark:text-zinc-200 text-xs sm:text-sm">
                              {row.nombre_completo || `${row.nombres || ''} ${row.apellidos || ''}`.trim()}
                            </span>

                            {/* Badge de edad obtenida */}
                            {row.edad !== null && row.edad !== undefined && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-blue-800/40 font-mono tabular-nums shrink-0">
                                {typeof row.edad === 'number' ? `${row.edad}a` : row.edad}
                              </span>
                            )}

                            {/* Badge de Corrección */}
                            {(row.nombre_fue_corregido || row.nombre_corregido) ? (
                              <span
                                title={`Original del archivo: ${row.nombre_original || row.nombre_original_archivo || 'N/A'}`}
                                className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60 shrink-0 inline-flex items-center gap-1"
                              >
                                ✦ Corregido
                              </span>
                            ) : row.verificado_censo ? (
                              <span
                                title="Verificado plenamente contra el Censo Electoral Oficial"
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 shrink-0"
                              >
                                ✦ Censo
                              </span>
                            ) : row.isEnriching ? (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-white/[0.04] shrink-0 animate-pulse"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                                Consultando...
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono tabular-nums">
                          {row.edad !== null && row.edad !== undefined ? (
                            <span className="font-semibold text-slate-900 dark:text-white px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.07]">
                              {row.edad} años
                            </span>
                          ) : row.isEnriching ? (
                            <span className="text-slate-400 dark:text-zinc-500 italic text-[11px] animate-pulse">Calculando...</span>
                          ) : (
                            <span className="text-slate-400 dark:text-zinc-600 italic">N/A</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-slate-500 dark:text-zinc-400">
                          {row.telefono || <span className="text-slate-400 dark:text-zinc-600 italic font-sans">N/A</span>}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-zinc-300 truncate max-w-[200px]" title={row.puesto_votacion}>
                          {row.puesto_votacion}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
                            M-{row.mesa}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Botón de Ejecución de la Carga */}
            <div className="pt-6 mt-6 border-t border-slate-200 dark:border-white/[0.07] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={startBatchImport}
                disabled={!isReady}
                className={`py-3 px-6 rounded-xl text-xs sm:text-sm font-semibold tracking-wide flex items-center gap-2.5 transition-all shadow-md cursor-pointer ${
                  isReady
                    ? 'bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white shadow-blue-600/20'
                    : 'bg-slate-100 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.06] text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                }`}
              >
                <Layers className="w-4 h-4 text-white" />
                <span>
                  Guardar e Importar al Padrón ({preflight.validRows.length.toLocaleString('es-CO')} registros)
                </span>
                <ArrowRight className="w-4 h-4 text-white ml-1" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 6. Barra de Progreso en Tiempo Real durante la Carga */}
      {isUploading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springTransition}
          className="rounded-2xl bg-white dark:bg-[#121215] border border-blue-500/30 p-6 sm:p-8 shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Procesando Carga Masiva en Lotes
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  {progress.currentChunkMessage}
                </p>
              </div>
            </div>

            <div className="font-mono tabular-nums text-lg font-bold text-blue-600 dark:text-blue-400">
              {progress.percentage}%
            </div>
          </div>

          {/* Barra de Progreso Fluida sin neón artificial */}
          <div className="space-y-2">
            <div className="h-2.5 w-full bg-slate-100 dark:bg-[#18181b] rounded-full overflow-hidden border border-slate-200 dark:border-white/[0.08] p-0.5 relative">
              <motion.div
                className="relative h-full rounded-full bg-blue-600 dark:bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={springTransition}
              />
            </div>

            {/* Segmentación visual por bloques (chunks de 1.000) */}
            {progress.totalChunks > 1 && (
              <div className="flex gap-1 pt-1">
                {Array.from({ length: Math.min(progress.totalChunks, 24) }).map((_, i) => {
                  const isDone = i + 1 < progress.currentChunk || progress.status === 'completed';
                  const isCurrent = i + 1 === progress.currentChunk && progress.status === 'uploading';
                  return (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-200 ${
                        isDone
                          ? 'bg-blue-600 dark:bg-blue-500'
                          : isCurrent
                          ? 'bg-amber-500 dark:bg-amber-400 animate-pulse'
                          : 'bg-slate-200 dark:bg-white/[0.06]'
                      }`}
                      title={`Lote ${i + 1}`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400 pt-2 border-t border-slate-200 dark:border-white/[0.07]">
            <span>
              Lote {progress.currentChunk} de {progress.totalChunks} (1.000 reg/chunk)
            </span>
            <span>
              Procesados: <strong className="text-slate-900 dark:text-white tabular-nums">{progress.processed.toLocaleString('es-CO')}</strong> / <span className="tabular-nums">{progress.totalToUpload.toLocaleString('es-CO')}</span>
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};
