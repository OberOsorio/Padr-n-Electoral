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
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useBulkUpload } from './bulk/useBulkUpload';

interface BulkUploadViewProps {
  onNavigateToElectors?: () => void;
  onNavigateToDashboard?: () => void;
}

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

  const isUploading = progress.status === 'uploading';
  const isCompleted = progress.status === 'completed';
  const isReady = progress.status === 'ready' && preflight && preflight.validRows.length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 pb-24 md:pb-10 animate-in fade-in duration-300">
      {/* 1. Header Ejecutivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700/60 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span>Carga Masiva de Electores</span>
          </h1>
        </div>

        {/* Acciones del Header */}
        <div className="flex items-center gap-2 sm:gap-3 self-stretch sm:self-auto relative">
          {onNavigateToDashboard && (
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-all shadow-xs"
            >
              Dashboard
            </button>
          )}

          {/* Menú de Plantilla Oficial */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTemplateMenu(!showTemplateMenu)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/30 hover:bg-blue-100 dark:hover:bg-blue-600/20 text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Plantilla</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {showTemplateMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-xl z-50 p-1.5 space-y-1 backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    downloadOfficialTemplate('xlsx');
                    setShowTemplateMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Plantilla Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    downloadOfficialTemplate('csv');
                    setShowTemplateMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/60 flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Plantilla CSV (.csv UTF-8)</span>
                </button>
              </div>
            )}
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
        <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-500/30 p-6 sm:p-8 shadow-xs dark:shadow-2xl relative overflow-hidden backdrop-blur-md animate-in zoom-in-95 duration-300 transition-colors">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <CheckCircle2 className="w-48 h-48 text-emerald-400" />
          </div>

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-semibold">
                  Operación Completada
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Carga Masiva Exitosa
                </h2>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              El archivo <span className="font-mono text-emerald-700 dark:text-emerald-300 font-semibold">{postSummary.fileName}</span> fue procesado e integrado al padrón electoral central sin interrupciones.
            </p>

            {/* Grid de Métricas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Electores Ingresados
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {postSummary.successful.toLocaleString('es-CO')}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Filas Omitidas / Errores
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1 block">
                  {postSummary.skipped.toLocaleString('es-CO')}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Tiempo Total
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-slate-800 dark:text-[#F8FAFC] mt-1 block">
                  {(postSummary.durationMs / 1000).toFixed(1)}s
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Velocidad
                </span>
                <span className="text-xl sm:text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 block">
                  {postSummary.durationMs > 0
                    ? Math.round((postSummary.totalProcessed / (postSummary.durationMs / 1000)))
                    : postSummary.totalProcessed} reg/s
                </span>
              </div>
            </div>

            {/* Botones de Acción Posterior */}
            <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/60">
              {onNavigateToElectors && (
                <button
                  type="button"
                  onClick={onNavigateToElectors}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  <span>Explorar Padrón de Electores</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {postSummary.errors > 0 && (
                <button
                  type="button"
                  onClick={downloadErrorsReport}
                  className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 hover:border-amber-300 dark:hover:border-amber-500/50 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Reporte de Rechazos ({postSummary.errors})</span>
                </button>
              )}

              <button
                type="button"
                onClick={resetUpload}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ml-auto shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Cargar Otro Archivo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Zona Drag & Drop (Si no se ha cargado o está en estado inicial) */}
      {!file && !isCompleted && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`rounded-2xl border-2 border-dashed transition-all p-10 sm:p-16 text-center cursor-pointer relative overflow-hidden backdrop-blur-md group ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-md dark:shadow-[0_0_30px_rgba(37,99,235,0.2)]'
              : 'border-slate-300 dark:border-slate-700/60 bg-white dark:bg-slate-800/80 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800'
          }`}
        >
          <div className="max-w-md mx-auto space-y-4">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 group-hover:border-blue-500/40 transition-all shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div>
              <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                Arrastra tu archivo aquí o <span className="text-blue-600 dark:text-blue-400 underline underline-offset-4">haz clic para examinar</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Formatos compatibles: <strong className="text-slate-700 dark:text-slate-200">.xlsx, .xls, .csv</strong> (delimitado por coma o punto y coma)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Spinner de Parsing inicial o Error de Lectura */}
      {(progress.status === 'parsing' || progress.status === 'validating') && (
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 text-center space-y-3 shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto" />
          <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
            {progress.currentChunkMessage}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Analizando estructura tabular y deduplicando documentos...
          </p>
        </div>
      )}

      {progress.status === 'error' && (
        <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-300 space-y-4">
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
            onClick={resetUpload}
            className="px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 dark:bg-rose-900/40 dark:hover:bg-rose-900/60 border border-rose-300 dark:border-rose-500/40 text-xs font-semibold text-rose-900 dark:text-rose-100 transition-colors cursor-pointer"
          >
            Intentar con otro archivo
          </button>
        </div>
      )}

      {/* 5. Pre-flight Validation Summary & Configuración */}
      {preflight && !isCompleted && progress.status !== 'uploading' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Ficha Resumen del Archivo y Columnas Detectadas */}
          <div className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-5 sm:p-7 shadow-xs dark:shadow-xl backdrop-blur-md transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white font-mono">
                    {preflight.fileName}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {(preflight.fileSize / 1024).toFixed(1)} KB • {preflight.totalRawRows} filas totales en origen
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={resetUpload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Cambiar Archivo</span>
              </button>
            </div>

            {/* KPI Cards de Auditoría */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Filas Válidas para Inserción
                </span>
                <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1 block">
                  {preflight.validRows.length.toLocaleString('es-CO')}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Cumplen con cédula, nombres y estructura
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Filas con Inconsistencias
                </span>
                <span className={`text-2xl font-bold font-mono mt-1 block ${
                  preflight.invalidRows.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                }`}>
                  {preflight.invalidRows.length.toLocaleString('es-CO')}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  {preflight.duplicateCedulasInFile > 0
                    ? `${preflight.duplicateCedulasInFile} duplicados internos en el archivo`
                    : 'Serán omitidas del procesamiento'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  Lotes Estimados (Chunks)
                </span>
                <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1 block">
                  {Math.ceil(preflight.validRows.length / 1000)}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  1.000 registros por llamada de red
                </span>
              </div>
            </div>

            {/* Columnas Reconocidas */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">
                Mapeo Automático de Columnas Reconocidas:
              </span>
              <div className="flex flex-wrap gap-2">
                {preflight.detectedColumns.map((col, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-[11px] font-mono text-slate-700 dark:text-slate-300"
                  >
                    <span className="text-slate-500 dark:text-slate-400">{col.original}</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">➔</span>
                    <strong className="text-blue-700 dark:text-blue-300">{col.mappedTo}</strong>
                  </span>
                ))}
              </div>
            </div>

            {/* Política de Colisión de Registros */}
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700/60">
              <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono block mb-3">
                Política de Manejo de Duplicados en Base de Datos:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    collisionMode === 'skip'
                      ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-500/60 ring-1 ring-blue-400/30 dark:ring-blue-500/30 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="collision"
                    checked={collisionMode === 'skip'}
                    onChange={() => setCollisionMode('skip')}
                    className="mt-0.5 accent-blue-600 dark:accent-blue-500"
                  />
                  <div className="text-xs">
                    <strong className="block text-slate-900 dark:text-white">
                      Omitir registros existentes (Recomendado)
                    </strong>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-relaxed">
                      Si la cédula ya se encuentra en la base de datos, se conserva intacta sin sobreescribir su puesto ni mesa.
                    </span>
                  </div>
                </label>

                <label
                  className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                    collisionMode === 'upsert'
                      ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-500/60 ring-1 ring-blue-400/30 dark:ring-blue-500/30 text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="collision"
                    checked={collisionMode === 'upsert'}
                    onChange={() => setCollisionMode('upsert')}
                    className="mt-0.5 accent-blue-600 dark:accent-blue-500"
                  />
                  <div className="text-xs">
                    <strong className="block text-slate-900 dark:text-white">
                      Actualizar datos existentes (Upsert)
                    </strong>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block leading-relaxed">
                      Sobrescribe los datos de electores existentes con la nueva información de puesto y teléfono provista en este archivo.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Vista Previa de Filas Válidas */}
            <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
                  Muestra Preliminar (Primeras 5 filas a procesar):
                </span>
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

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-900/60 shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200 dark:border-slate-700/60 tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Cédula</th>
                      <th className="py-2.5 px-3">Nombre Completo</th>
                      <th className="py-2.5 px-3">Teléfono</th>
                      <th className="py-2.5 px-3">Puesto Asignado</th>
                      <th className="py-2.5 px-3 text-center">Mesa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 text-slate-700 dark:text-slate-300">
                    {preflight.validRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-[#F8FAFC]">
                          {row.cedula}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">
                          {row.nombres} {row.apellidos}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-500 dark:text-slate-400">
                          {row.telefono || <span className="text-slate-400 dark:text-slate-500 italic">N/A</span>}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-200 truncate max-w-[200px]" title={row.puesto_votacion}>
                          {row.puesto_votacion}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
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
            <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={startBatchImport}
                disabled={!isReady}
                className={`py-3 px-6 rounded-xl text-xs sm:text-sm font-semibold tracking-wide flex items-center gap-2.5 transition-all shadow-xl cursor-pointer ${
                  isReady
                    ? 'bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
              >
                <Layers className="w-4 h-4 text-white" />
                <span>
                  Iniciar Importación ({preflight.validRows.length.toLocaleString('es-CO')} registros)
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Barra de Progreso en Tiempo Real durante la Carga */}
      {isUploading && (
        <div className="rounded-2xl bg-white dark:bg-slate-800/95 border border-blue-500/40 p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-in fade-in duration-200 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600 dark:text-blue-400" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Procesando Carga Masiva en Lotes
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-300">
                  {progress.currentChunkMessage}
                </p>
              </div>
            </div>

            <div className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400">
              {progress.percentage}%
            </div>
          </div>

          {/* Barra de Progreso Fluida con Gradiente en Movimiento y Brillo */}
          <div className="space-y-2">
            <div className="h-3.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700/60 p-0.5 relative">
              <motion.div
                className="relative h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-[#E5B869] shadow-[0_0_15px_rgba(37,99,235,0.6)]"
                initial={{ width: 0 }}
                animate={{ width: `${progress.percentage}%` }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                {/* Destello de gradiente animado continuo */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: 'linear' }}
                />
                {/* Micro destello luminoso en la punta */}
                <span className="absolute right-0 top-0 bottom-0 w-2 rounded-full bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
              </motion.div>
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
                          ? 'bg-blue-500 shadow-[0_0_6px_rgba(37,99,235,0.8)]'
                          : isCurrent
                          ? 'bg-[#E5B869] animate-pulse shadow-[0_0_6px_rgba(229,184,105,0.8)]'
                          : 'bg-slate-300 dark:bg-slate-700/60'
                      }`}
                      title={`Lote ${i + 1}`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700/60">
            <span>
              Lote {progress.currentChunk} de {progress.totalChunks} (1.000 reg/chunk)
            </span>
            <span>
              Procesados: <strong className="text-slate-900 dark:text-white">{progress.processed.toLocaleString('es-CO')}</strong> / {progress.totalToUpload.toLocaleString('es-CO')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
