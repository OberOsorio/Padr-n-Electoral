import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  UserPlus,
  Loader2,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ClipboardPaste,
  X,
  ExternalLink,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Vote,
  Map,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { consultarLugarVotacion, type CensoLookupResult } from '../../services/censoLookupService';

interface ConsultaLugarVotacionViewProps {
  onNavigateToRegister?: () => void;
}

export const ConsultaLugarVotacionView: React.FC<ConsultaLugarVotacionViewProps> = ({
  onNavigateToRegister,
}) => {
  const [cedula, setCedula] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CensoLookupResult | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [history, setHistory] = useState<CensoLookupResult[]>(() => {
    try {
      const stored = localStorage.getItem('electoral_lookup_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (targetCedula?: string) => {
    const rawVal = targetCedula ?? cedula;
    const cleanCedula = rawVal.trim().replace(/\D/g, '');
    if (!cleanCedula || cleanCedula.length < 4) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const data = await consultarLugarVotacion(cleanCedula);
      setResult(data);

      if (data.encontrado) {
        setHistory((prev) => {
          const filtered = prev.filter((item) => item.cedula !== data.cedula);
          const updated = [data, ...filtered].slice(0, 10);
          try {
            localStorage.setItem('electoral_lookup_history', JSON.stringify(updated));
          } catch {}
          return updated;
        });
      }
    } catch (err) {
      console.error('Error al consultar censo:', err);
      setResult({ encontrado: false, cedula: cleanCedula });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const clean = text.replace(/\D/g, '');
      if (clean) {
        setCedula(clean);
        handleSearch(clean);
      }
    } catch {
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    setCedula('');
    setResult(null);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  const handleCopyText = (text: string, fieldName: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 1800);
    } catch {}
  };

  const handleTransferToRegister = (itemToTransfer: CensoLookupResult) => {
    try {
      sessionStorage.setItem(
        'electoral_pending_registration',
        JSON.stringify({
          cedula: itemToTransfer.cedula,
          nombres: itemToTransfer.nombres || '',
          apellidos: itemToTransfer.apellidos || '',
          puesto: itemToTransfer.puesto || '',
          mesa: itemToTransfer.mesa || 1,
          departamento: itemToTransfer.departamento || '',
          municipio: itemToTransfer.municipio || '',
        })
      );
    } catch {}

    if (onNavigateToRegister) {
      onNavigateToRegister();
    }
  };

  const handleOpenRegistraduria = () => {
    window.open('https://consultacenso.registraduria.gov.co/', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-[calc(100vh-4.25rem)] w-full bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* 1. Encabezado de la Herramienta Operativa */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/10 dark:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
              <Vote className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Consulta de Lugar de Votación
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Censo Oficial
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verificación inmediata de puesto, mesa y municipio para enrolamiento de electores
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenRegistraduria}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
            title="Abrir portal oficial de la Registraduría Nacional en pestaña externa"
          >
            <span>Portal Registraduría</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* 2. Barra de Búsqueda Principal (Grande y Directa) */}
        <div className="rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-slate-700/60 p-4 sm:p-6 shadow-md transition-all">
          <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
            Número de Documento / Cédula del Elector
          </label>

          <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                value={cedula}
                onChange={(e) => setCedula(e.target.value.replace(/\D/g, ''))}
                onKeyDown={handleKeyDown}
                placeholder="Ingrese número de cédula (ej. 1067984321)..."
                disabled={loading}
                className="w-full h-12 pl-11 pr-20 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl text-base font-mono font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />

              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {cedula && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    title="Limpiar campo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handlePaste}
                  className="px-2 py-1 rounded-md text-xs font-mono font-semibold bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Pegar desde el portapapeles"
                >
                  <ClipboardPaste className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pegar</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={loading || !cedula.trim() || cedula.trim().length < 4}
              className="h-12 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Consultando...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Consultar Lugar de Votación</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 px-0.5">
            <span>Presione Enter o haga clic en Consultar para buscar en la base oficial.</span>
            {hasSearched && (
              <button
                type="button"
                onClick={handleClear}
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Nueva consulta</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. Tarjeta Oficial de Resultados (Limpia, Alta Fidelidad) */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-slate-700/60 p-12 text-center shadow-md flex flex-col items-center justify-center gap-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Verificando censo electoral oficial...
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Consultando puesto de votación y mesa asignada
              </p>
            </motion.div>
          )}

          {!loading && result && result.encontrado && (
            <motion.div
              key="found"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-white dark:bg-[#161F30] border-2 border-emerald-500/30 dark:border-emerald-500/40 shadow-xl overflow-hidden"
            >
              {/* Encabezado del Elector Encontrado */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent p-5 sm:p-6 border-b border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        Elector Identificado en Censo
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight mt-1">
                      {result.nombres} {result.apellidos}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-mono mt-0.5 flex items-center gap-2">
                      <span>C.C. {Number(result.cedula).toLocaleString('es-CO')}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyText(result.cedula, 'cedula')}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                        title="Copiar cédula"
                      >
                        {copiedField === 'cedula' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </p>
                  </div>
                </div>

                {/* Botón de Acción Rápida: Vincular a Campaña */}
                <button
                  type="button"
                  onClick={() => handleTransferToRegister(result)}
                  className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer group"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Vincular / Registrar en Campaña</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Grid Oficial con los 4 Datos de Votación Limpios */}
              <div className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/50 dark:bg-slate-900/40">
                {/* 1. Departamento */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Departamento</span>
                    <Map className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {result.departamento || 'Córdoba'}
                  </p>
                </div>

                {/* 2. Municipio */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Municipio</span>
                    <MapPin className="w-4 h-4 text-indigo-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {result.municipio || 'Montería'}
                  </p>
                </div>

                {/* 3. Lugar / Puesto de Votación */}
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 dark:text-slate-500 mb-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-semibold">Puesto de Votación</span>
                    <Building2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate" title={result.puesto}>
                    {result.puesto || 'Puesto Principal'}
                  </p>
                  {result.direccion && (
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {result.direccion}
                    </p>
                  )}
                </div>

                {/* 4. Número de Mesa */}
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 shadow-xs">
                  <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider font-bold">Mesa de Votación</span>
                    <Vote className="w-4 h-4" />
                  </div>
                  <p className="text-2xl font-extrabold text-blue-700 dark:text-blue-400 font-mono">
                    Mesa {result.mesa || 1}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {!loading && result && !result.encontrado && hasSearched && (
            <motion.div
              key="not-found"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl bg-white dark:bg-[#161F30] border border-amber-200 dark:border-amber-900/50 p-6 sm:p-8 shadow-md"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Cédula no encontrada en el censo precargado
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      El documento <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{result.cedula}</span> no cuenta con registro previo en la base de censo local.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem(
                        'electoral_pending_registration',
                        JSON.stringify({ cedula: result.cedula })
                      );
                      onNavigateToRegister?.();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Registrar Elector Manualmente</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenRegistraduria}
                    className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Verificar en Registraduría</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. Historial Reciente de Consultas (Herramienta Operativa) */}
        {history.length > 0 && (
          <div className="rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-slate-700/60 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Historial de Consultas de la Sesión ({history.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setHistory([]);
                  localStorage.removeItem('electoral_lookup_history');
                }}
                className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Limpiar historial
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {history.map((item) => (
                <div
                  key={item.cedula}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all flex items-center justify-between gap-2 group"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCedula(item.cedula);
                      setResult(item);
                      setHasSearched(true);
                    }}
                    className="text-left flex-1 min-w-0 cursor-pointer"
                  >
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {item.nombres} {item.apellidos}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      C.C. {item.cedula} • Mesa {item.mesa}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTransferToRegister(item)}
                    className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white transition-colors shrink-0 cursor-pointer"
                    title="Transferir a Registrar Elector"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
