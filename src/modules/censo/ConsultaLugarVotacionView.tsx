import React, { useState } from 'react';
import {
  ExternalLink,
  RotateCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Globe,
  UserPlus,
  Loader2,
  MapPin,
  Building,
} from 'lucide-react';
import { buscarCiudadanoEnCenso } from '../../services/censoService';

interface ConsultaLugarVotacionViewProps {
  onNavigateToRegister?: () => void;
}

const REGISTRADURIA_URL = 'https://consultacenso.registraduria.gov.co/';

export const ConsultaLugarVotacionView: React.FC<ConsultaLugarVotacionViewProps> = ({
  onNavigateToRegister,
}) => {
  const [iframeKey, setIframeKey] = useState<number>(Date.now());
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [quickCedula, setQuickCedula] = useState('');
  const [searchingQuick, setSearchingQuick] = useState(false);
  const [quickResult, setQuickResult] = useState<{
    found: boolean;
    data?: any;
    message?: string;
  } | null>(null);

  const handleRefreshIframe = () => {
    setIframeKey(Date.now());
  };

  const handleOpenPopup = () => {
    const width = 1000;
    const height = 800;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      REGISTRADURIA_URL,
      'RegistraduriaConsultaCenso',
      `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
    );
  };

  const handleCopyUrl = () => {
    try {
      navigator.clipboard.writeText(REGISTRADURIA_URL);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleQuickSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCedula = quickCedula.trim().replace(/\D/g, '');
    if (!cleanCedula) return;

    setSearchingQuick(true);
    setQuickResult(null);

    try {
      const result = await buscarCiudadanoEnCenso(cleanCedula);
      if (result) {
        setQuickResult({
          found: true,
          data: result,
        });
      } else {
        setQuickResult({
          found: false,
          message: 'Cédula no encontrada en censo local precargado. Por favor consulte en el portal oficial de la Registraduría.',
        });
      }
    } catch {
      setQuickResult({
        found: false,
        message: 'No fue posible consultar el censo local en este momento.',
      });
    } finally {
      setSearchingQuick(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4.25rem)] w-full bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* 1. Barra de Herramientas y Navegación Superior */}
      <div className="shrink-0 bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Consulta Lugar de Votación
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Registraduría Nacional
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Portal Oficial: <span className="font-mono text-slate-700 dark:text-slate-300">consultacenso.registraduria.gov.co</span>
            </p>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-2">
          {/* Botón Abrir en Ventana Emergente */}
          <button
            type="button"
            onClick={handleOpenPopup}
            title="Abrir el portal oficial en una ventana integrada paralela sin salir del sistema"
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Abrir en Ventana Integrada</span>
            <span className="md:hidden">Abrir Ventana</span>
          </button>

          {/* Botón Recargar */}
          <button
            type="button"
            onClick={handleRefreshIframe}
            title="Recargar el visor del portal oficial"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Botón Copiar URL */}
          <button
            type="button"
            onClick={handleCopyUrl}
            title="Copiar enlace oficial de la Registraduría"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {copiedUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Enlace directo a Registrar Elector */}
          {onNavigateToRegister && (
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-500" />
              <span>Ir a Registrar Elector</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Sub-Barra de Búsqueda Rápida Local (Asistente Integrado) */}
      <div className="shrink-0 bg-slate-100/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleQuickSearch} className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 font-mono hidden md:inline">
            Consulta Rápida Local:
          </span>
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={quickCedula}
              onChange={(e) => setQuickCedula(e.target.value)}
              placeholder="Cédula para consulta rápida..."
              className="w-full h-8 pl-8 pr-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={searchingQuick || !quickCedula.trim()}
            className="h-8 px-3 rounded-lg bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-[11px] font-medium transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            {searchingQuick ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Buscar</span>}
          </button>
        </form>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>Si el visor integrado está protegido por la Registraduría, use <b>"Abrir en Ventana Integrada"</b>.</span>
        </div>
      </div>

      {/* Resultado de Búsqueda Rápida si existe */}
      {quickResult && (
        <div className="shrink-0 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900/60 p-3 px-4">
          {quickResult.found ? (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="font-semibold text-slate-900 dark:text-white">
                  {quickResult.data.nombres} {quickResult.data.apellidos}
                </span>
                <span className="font-mono text-slate-500">| Cédula: {quickResult.data.cedula}</span>
                {quickResult.data.puesto_votacion && (
                  <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                    <Building className="w-3.5 h-3.5 text-blue-500" />
                    <b>Puesto:</b> {quickResult.data.puesto_votacion} (Mesa {quickResult.data.mesa || 'Sin asignar'})
                  </span>
                )}
                {quickResult.data.municipio && (
                  <span className="flex items-center gap-1 text-slate-500">
                    <MapPin className="w-3 h-3" />
                    {quickResult.data.municipio}, {quickResult.data.departamento}
                  </span>
                )}
              </div>
              {onNavigateToRegister && (
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Enrolar Elector</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{quickResult.message}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Visor Iframe del Portal Oficial Registraduría */}
      <div className="flex-1 relative w-full h-full bg-slate-100 dark:bg-slate-950 overflow-hidden flex flex-col">
        {/* Iframe oficial de la Registraduría */}
        <iframe
          key={iframeKey}
          src={REGISTRADURIA_URL}
          title="Consulta de Censo y Lugar de Votación - Registraduría Nacional del Estado Civil"
          className="w-full flex-1 border-0 shadow-inner"
          allow="geolocation 'none'; camera 'none'; microphone 'none'"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />

        {/* Barra de pie con enlaces de soporte */}
        <div className="shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Registraduría Nacional del Estado Civil</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">República de Colombia</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenPopup}
              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Abrir ventana externa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
