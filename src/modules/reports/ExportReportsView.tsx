import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Users,
  Download,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import { exportarElectoresExcel } from '../../services/exportService';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export interface ExportReportsViewProps {
  onNavigateToDashboard?: () => void;
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

interface LeaderOption {
  id: string;
  name: string;
  role: string;
  electoresCount: number;
}

export const ExportReportsView: React.FC<ExportReportsViewProps> = ({
  onNavigateToDashboard,
}) => {
  const { currentTenantId, currentTenant } = useTenant();
  const isOnline = useOnlineStatus();

  const [loading, setLoading] = useState(true);
  const [totalElectores, setTotalElectores] = useState(0);
  const [leaders, setLeaders] = useState<LeaderOption[]>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>('');
  const [exportingType, setExportingType] = useState<'consolidated' | 'leader' | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Consulta ligera de electores y líderes de la campaña activa
  const fetchCounts = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      if (!isSupabaseConfigured) {
        const stored = localStorage.getItem('electoral_local_electors');
        const localElectors: any[] = stored ? JSON.parse(stored) : [];
        const scopedElectors = currentTenantId
          ? localElectors.filter((e) => !e.tenant_id || e.tenant_id === currentTenantId)
          : localElectors;

        const storedTeam = localStorage.getItem('electoral_local_team');
        const localTeam: any[] = storedTeam ? JSON.parse(storedTeam) : [];

        const countsMap: Record<string, number> = {};
        scopedElectors.forEach((e) => {
          if (e.registrado_por) {
            countsMap[e.registrado_por] = (countsMap[e.registrado_por] || 0) + 1;
          }
        });

        const leadersList: LeaderOption[] = localTeam
          .map((m) => ({
            id: m.id,
            name: m.full_name || 'Miembro de Equipo',
            role: m.role || 'lider',
            electoresCount: countsMap[m.id] || 0,
          }))
          .filter((l) => l.electoresCount > 0)
          .sort((a, b) => b.electoresCount - a.electoresCount || a.name.localeCompare(b.name));

        setTotalElectores(scopedElectors.length);
        setLeaders(leadersList);
        return;
      }

      const clientToUse = supabaseAdmin || supabase;

      // Consulta del conteo de electores para el tenant actual
      let electoresQuery = clientToUse
        .from('electores')
        .select('id, registrado_por', { count: 'exact' });

      if (currentTenantId) {
        electoresQuery = (electoresQuery as any).eq('tenant_id', currentTenantId);
      }

      const { data: electoresData, count: totalCount, error: electoresErr } = await (electoresQuery as any);
      if (electoresErr) throw electoresErr;

      // Calcular conteo exacto de electores reales por cada líder/registrador
      const countsMap: Record<string, number> = {};
      ((electoresData as any[]) || []).forEach((e: any) => {
        if (e.registrado_por) {
          countsMap[e.registrado_por] = (countsMap[e.registrado_por] || 0) + 1;
        }
      });

      // Obtener únicamente los IDs de los líderes que realmente tienen electores registrados
      const realLeaderIds = Object.keys(countsMap).filter((id) => (countsMap[id] || 0) > 0);

      if (realLeaderIds.length === 0) {
        setTotalElectores(totalCount || 0);
        setLeaders([]);
        return;
      }

      // Consulta de perfiles exclusivamente de los líderes que tienen electores en la base de datos
      const { data: profilesData, error: profilesErr } = await clientToUse
        .from('profiles')
        .select('id, full_name, role')
        .in('id', realLeaderIds);

      if (profilesErr) console.warn('Error al consultar perfiles de líderes reales:', profilesErr);

      const profilesMap = new Map<string, { id: string; name: string; role: string }>();

      ((profilesData as any[]) || []).forEach((p: any) => {
        profilesMap.set(p.id, {
          id: p.id,
          name: p.full_name || 'Líder Registrado',
          role: p.role || 'lider',
        });
      });

      // Construir lista exclusivamente con líderes reales y registros existentes en la BD
      const leadersList: LeaderOption[] = realLeaderIds
        .map((leaderId) => {
          const profile = profilesMap.get(leaderId);
          return {
            id: leaderId,
            name: profile?.name || `Líder Registrado (${leaderId.slice(0, 8)})`,
            role: profile?.role || 'lider',
            electoresCount: countsMap[leaderId] || 0,
          };
        })
        .filter((l) => l.electoresCount > 0)
        .sort((a, b) => b.electoresCount - a.electoresCount || a.name.localeCompare(b.name));

      setTotalElectores(totalCount || 0);
      setLeaders(leadersList);
    } catch (err: any) {
      console.error('Error cargando datos para exportación:', err);
      const msg = String(err?.message || '');
      const isNetworkErr =
        msg.toLowerCase().includes('network') ||
        msg.toLowerCase().includes('fetch') ||
        (typeof navigator !== 'undefined' && !navigator.onLine);

      // No mostrar errores técnicos de red cuando no hay internet
      if (!isNetworkErr) {
        setErrorMsg(msg || 'Error al conectar con la base de datos.');
      }
    } finally {
      setLoading(false);
    }
  }, [currentTenantId]);

  useEffect(() => {
    if (isOnline) {
      fetchCounts();
    }
  }, [fetchCounts, isOnline]);

  // Opción A: Descargar Padrón Completo Consolidado
  const handleExportConsolidated = async () => {
    if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      setErrorMsg('No es posible exportar sin conexión a internet.');
      return;
    }
    if (totalElectores === 0) return;
    setExportingType('consolidated');
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await exportarElectoresExcel({
        tenantId: currentTenantId,
      });
      setSuccessMsg(`Padrón consolidado descargado exitosamente (${res.count.toLocaleString('es-CO')} electores en ${res.fileName}).`);
    } catch (err: any) {
      console.error('Error exportando consolidado:', err);
      const msg = String(err?.message || '');
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        setErrorMsg('Error de conexión a internet. Verifica tu red e intenta nuevamente.');
      } else {
        setErrorMsg(msg || 'Ocurrió un error al generar el archivo Excel.');
      }
    } finally {
      setExportingType(null);
    }
  };

  // Opción B: Descargar Reporte Individual por Líder
  const handleExportLeader = async () => {
    if (!isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      setErrorMsg('No es posible exportar sin conexión a internet.');
      return;
    }
    if (!selectedLeaderId) return;
    const leader = leaders.find((l) => l.id === selectedLeaderId);
    if (!leader || leader.electoresCount === 0) return;

    setExportingType('leader');
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await exportarElectoresExcel({
        tenantId: currentTenantId,
        registradoPorId: leader.id,
        liderNombre: leader.name,
        nombreCampana: currentTenant?.name || 'TODO POR COTORRA',
      });
      setSuccessMsg(`Reporte de ${leader.name} descargado exitosamente (${res.count.toLocaleString('es-CO')} electores en ${res.fileName}).`);
    } catch (err: any) {
      console.error('Error exportando reporte del líder:', err);
      const msg = String(err?.message || '');
      if (msg.toLowerCase().includes('network') || msg.toLowerCase().includes('fetch')) {
        setErrorMsg('Error de conexión a internet. Verifica tu red e intenta nuevamente.');
      } else {
        setErrorMsg(msg || 'Ocurrió un error al generar el archivo Excel.');
      }
    } finally {
      setExportingType(null);
    }
  };

  const selectedLeader = leaders.find((l) => l.id === selectedLeaderId);

  // Si no hay acceso a internet, no mostrar los reportes ni lanzar errores
  if (!isOnline) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6 animate-in fade-in duration-300">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
          <WifiOff className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Módulo no disponible sin conexión
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            La exportación de reportes requiere conexión a internet para consultar los datos del padrón electoral en vivo.
          </p>
        </div>
        {onNavigateToDashboard && (
          <button
            type="button"
            onClick={onNavigateToDashboard}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs sm:text-sm font-semibold hover:opacity-90 transition-all cursor-pointer shadow-md"
          >
            Volver al Dashboard
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 pb-24 md:pb-12 animate-in fade-in duration-300">
      {/* 1. Header Ejecutivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span>Exportar Datos del Padrón</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Descarga directa de información en libros Microsoft Excel (.xlsx) nativos.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 self-stretch sm:self-auto">
          {onNavigateToDashboard && (
            <button
              type="button"
              onClick={onNavigateToDashboard}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white text-xs font-medium transition-all shadow-xs cursor-pointer"
            >
              Volver al Dashboard
            </button>
          )}

          <button
            type="button"
            onClick={fetchCounts}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer shadow-xs"
            title="Recargar datos de la campaña"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alertas de Notificación */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm animate-in slide-in-from-top-2 duration-300 shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="flex-1 font-medium">{successMsg}</div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/50 flex items-center gap-3 text-rose-800 dark:text-rose-300 text-xs sm:text-sm animate-in slide-in-from-top-2 duration-300 shadow-md">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <div className="flex-1 font-medium">{errorMsg}</div>
        </div>
      )}

      {/* 2. Grid de Opciones Directas de Exportación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Opción A: "Exportar Padrón Completo" (Consolidado General) */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs dark:shadow-xl flex flex-col justify-between relative overflow-hidden backdrop-blur-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                Consolidado General
              </span>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                Padrón Electoral Consolidado
              </h2>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Total en Campaña:</span>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : `${totalElectores.toLocaleString('es-CO')} electores`}
              </span>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={handleExportConsolidated}
              disabled={loading || totalElectores === 0 || exportingType !== null}
              className={`w-full py-3 px-6 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                totalElectores === 0
                  ? 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 active:scale-[0.99] cursor-pointer'
              }`}
            >
              {exportingType === 'consolidated' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando Excel...</span>
                </>
              ) : totalElectores === 0 ? (
                <span>Sin registros para exportar</span>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Padrón Completo (.xlsx)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Opción B: "Exportar por Líder / Registrador" */}
        <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-xs dark:shadow-xl flex flex-col justify-between relative overflow-hidden backdrop-blur-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                <Users className="w-6 h-6" />
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                Por Responsable
              </span>
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white tracking-tight">
                Reporte Individual por Líder
              </h2>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
                Seleccione el Líder o Registrador:
              </label>
              <select
                value={selectedLeaderId}
                onChange={(e) => setSelectedLeaderId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer transition-all"
              >
                <option value="">Seleccione el Líder o Registrador...</option>
                {leaders.map((leader) => (
                  <option key={leader.id} value={leader.id}>
                    {leader.name} — ({leader.electoresCount} electores)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={handleExportLeader}
              disabled={
                loading ||
                !selectedLeaderId ||
                !selectedLeader ||
                selectedLeader.electoresCount === 0 ||
                exportingType !== null
              }
              className={`w-full py-3 px-6 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                !selectedLeaderId || !selectedLeader || selectedLeader.electoresCount === 0
                  ? 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/40 active:scale-[0.99] cursor-pointer'
              }`}
            >
              {exportingType === 'leader' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generando Excel...</span>
                </>
              ) : !selectedLeaderId ? (
                <span>Seleccione un líder</span>
              ) : selectedLeader?.electoresCount === 0 ? (
                <span>Líder sin registros</span>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Descargar Reporte del Líder (.xlsx)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ExportDataView = ExportReportsView;
export const ExportElectoralData = ExportReportsView;
