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
  Shield,
  ArrowRight,
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
  const [viewMode, setViewMode] = useState<'card' | 'iframe'>('card');
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
    const width = 1040;
    const height = 820;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open(
      REGISTRADURIA_URL,
      'RegistraduriaConsultaCenso',
      `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no,scrollbars=yes,resizable=yes`
    );
  };

  const handleOpenNewTab = () => {
    window.open(REGISTRADURIA_URL, '_blank', 'noopener,noreferrer');
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
          message: 'Cédula no encontrada en el censo local de la campaña. Por favor verifique en el portal oficial de la Registraduría.',
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
    <div className="flex flex-col h-[calc(100vh-4.25rem)] w-full bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      {/* 1. Barra de Herramientas y Navegación Superior */}
      <div className="shrink-0 bg-white dark:bg-[#161F30] border-b border-slate-200 dark:border-slate-700/60 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
                Consulta Lugar de Votación
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Registraduría Nacional
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Portal Oficial:{' '}
              <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                consultacenso.registraduria.gov.co
              </span>
            </p>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-2">
          {/* Alternar entre Ficha Institucional y Visor Embebido */}
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200 dark:border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                viewMode === 'card'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Ficha Oficial
            </button>
            <button
              type="button"
              onClick={() => setViewMode('iframe')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                viewMode === 'iframe'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Visor Web
            </button>
          </div>

          {/* Botón Abrir en Ventana Integrada */}
          <button
            type="button"
            onClick={handleOpenPopup}
            title="Abrir el portal oficial en una ventana integrada paralela sin salir del sistema"
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Abrir en Ventana Integrada</span>
            <span className="md:hidden">Abrir Ventana</span>
          </button>

          {/* Botón Recargar (en modo visor) */}
          {viewMode === 'iframe' && (
            <button
              type="button"
              onClick={handleRefreshIframe}
              title="Recargar el visor del portal oficial"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}

          {/* Botón Copiar URL */}
          <button
            type="button"
            onClick={handleCopyUrl}
            title="Copiar enlace oficial de la Registraduría"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            {copiedUrl ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Enlace directo a Registrar Elector */}
          {onNavigateToRegister && (
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors cursor-pointer border border-slate-200 dark:border-slate-700/60"
            >
              <UserPlus className="w-3.5 h-3.5 text-blue-500" />
              <span>Ir a Registrar Elector</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Sub-Barra de Búsqueda Rápida Local (Asistente Integrado) */}
      <div className="shrink-0 bg-slate-100/90 dark:bg-[#131B2B] border-b border-slate-200 dark:border-slate-700/60 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs transition-colors">
        <form onSubmit={handleQuickSearch} className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 font-mono hidden md:inline">
            Consulta Rápida Local:
          </span>
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={quickCedula}
              onChange={(e) => setQuickCedula(e.target.value)}
              placeholder="Cédula para consulta rápida..."
              className="w-full h-8.5 pl-8 pr-3 bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={searchingQuick || !quickCedula.trim()}
            className="h-8.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-[11px] font-medium transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {searchingQuick ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Buscar</span>}
          </button>
        </form>

        <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
          <span>Para consultar el censo oficial sin restricciones de navegador, pulse <b>"Abrir en Ventana Integrada"</b>.</span>
        </div>
      </div>

      {/* Resultado de Búsqueda Rápida Local si existe */}
      {quickResult && (
        <div className="shrink-0 bg-blue-50/90 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-800/60 p-3 px-4 sm:px-6 transition-colors">
          {quickResult.found ? (
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold text-slate-900 dark:text-white">
                  {quickResult.data.nombres} {quickResult.data.apellidos}
                </span>
                <span className="font-mono text-slate-500 dark:text-slate-400">| Cédula: {quickResult.data.cedula}</span>
                {quickResult.data.puesto_votacion && (
                  <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                    <Building className="w-3.5 h-3.5 text-blue-500" />
                    <b>Puesto:</b> {quickResult.data.puesto_votacion} (Mesa {quickResult.data.mesa || 'Sin asignar'})
                  </span>
                )}
                {quickResult.data.municipio && (
                  <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <MapPin className="w-3 h-3" />
                    {quickResult.data.municipio}, {quickResult.data.departamento}
                  </span>
                )}
              </div>
              {onNavigateToRegister && (
                <button
                  type="button"
                  onClick={onNavigateToRegister}
                  className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Enrolar Elector</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{quickResult.message}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Área Principal */}
      {viewMode === 'card' ? (
        /* Modo Ficha Institucional Oficial (Evita bloqueos de SAMEORIGIN en navegadores) */
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 flex items-center justify-center">
          <div className="w-full max-w-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden transition-colors">
            {/* Realce decorativo superior */}
            <div 
              className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600"
              aria-hidden="true" 
            />

            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-sm">
                <Globe className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Portal Oficial de Consulta Electoral
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                Registraduría Nacional del Estado Civil — República de Colombia
              </p>
            </div>

            {/* Aviso de Seguridad del Estado */}
            <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold font-mono text-[11px] uppercase tracking-wider">
                <Shield className="w-4 h-4 text-blue-500" />
                <span>Política de Ciberseguridad Oficial</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                El portal oficial gubernamental (<span className="font-mono text-blue-600 dark:text-blue-400">consultacenso.registraduria.gov.co</span>) cuenta con protecciones anti-bot de Cloudflare y directivas de seguridad del Estado (<code className="font-mono text-[11px] bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">SAMEORIGIN</code>), por lo cual los navegadores restringen su apertura dentro de marcos incrustados.
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Para consultar el censo oficial sin restricciones y con total seguridad, ábralo con un solo clic a continuación. Se abrirá en una ventana emergente paralela optimizada <b>sin cerrar su sesión ni salir de la campaña</b>.
              </p>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleOpenPopup}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Abrir en Ventana Integrada</span>
              </button>

              <button
                type="button"
                onClick={handleOpenNewTab}
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700/60"
              >
                <span>Abrir en Nueva Pestaña</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setViewMode('iframe')}
                className="w-full sm:w-auto px-3.5 py-3 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                <span>Probar Visor Web</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Modo Visor Iframe Embebido */
        <div className="flex-1 relative w-full h-full bg-slate-100 dark:bg-slate-950 overflow-hidden flex flex-col">
          <iframe
            key={iframeKey}
            src={REGISTRADURIA_URL}
            title="Consulta de Censo y Lugar de Votación - Registraduría Nacional del Estado Civil"
            className="w-full flex-1 border-0 shadow-inner bg-white"
            allow="geolocation 'none'; camera 'none'; microphone 'none'"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      )}

      {/* Barra de pie con enlaces de soporte */}
      <div className="shrink-0 bg-white dark:bg-[#161F30] border-t border-slate-200 dark:border-slate-700/60 px-4 sm:px-6 py-2.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 transition-colors">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">Registraduría Nacional del Estado Civil</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">República de Colombia</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenPopup}
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Abrir ventana externa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
