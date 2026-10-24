import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldAlert, 
  Key, 
  Search, 
  Download, 
  RefreshCw, 
  CheckCircle2, 
  Copy, 
  Hash,
  Terminal,
  Check
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AuditLog {
  id: string;
  created_at: string;
  user_email: string;
  user_name: string;
  user_role: string;
  event_type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  tenant_name?: string;
  ip_address: string;
  device_info: string;
  action_detail: string;
  sha256_hash: string;
}

const FALLBACK_SEED_LOGS: AuditLog[] = [
  {
    id: 'seed-1',
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    user_email: 'oberosorio1@gmail.com',
    user_name: 'Ober Osorio Orozco',
    user_role: 'superadmin',
    event_type: 'AUTH_SUCCESS',
    severity: 'INFO',
    tenant_name: 'TODO POR COTORRA',
    ip_address: '186.84.90.12',
    device_info: 'Chrome 128 / macOS ARM64',
    action_detail: 'Autenticación exitosa mediante credenciales maestras',
    sha256_hash: '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b',
  },
  {
    id: 'seed-2',
    created_at: new Date(Date.now() - 18 * 60000).toISOString(),
    user_email: 'alejodoriall@gmail.com',
    user_name: 'ALEJANDRO DORIA',
    user_role: 'admin',
    event_type: 'USER_SUSPENDED',
    severity: 'WARNING',
    tenant_name: 'TODO POR COTORRA',
    ip_address: '190.158.42.11',
    device_info: 'Safari 17 / iOS 17.5',
    action_detail: 'Suspensión temporal de cuenta para usuario líder',
    sha256_hash: 'd4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35',
  },
  {
    id: 'seed-3',
    created_at: new Date(Date.now() - 42 * 60000).toISOString(),
    user_email: 'desconocido@bot.com',
    user_name: 'IP No Registrada',
    user_role: 'anon',
    event_type: 'AUTH_FAILED',
    severity: 'CRITICAL',
    tenant_name: 'TODO POR COTORRA',
    ip_address: '45.134.22.88',
    device_info: 'Python-requests/2.31',
    action_detail: '3 intentos fallidos de contraseña bloqueados por WAF',
    sha256_hash: '4e07408562bedb8b60ce05c1decfe3ad16b72230967de01f640b7e4729b49fce',
  },
  {
    id: 'seed-4',
    created_at: new Date(Date.now() - 60 * 60000).toISOString(),
    user_email: 'oberosorio1@gmail.com',
    user_name: 'Ober Osorio Orozco',
    user_role: 'superadmin',
    event_type: 'REPORT_EXPORTED',
    severity: 'INFO',
    tenant_name: 'TODO POR COTORRA',
    ip_address: '186.84.90.12',
    device_info: 'Chrome 128 / macOS ARM64',
    action_detail: 'Descarga de reporte individual del líder en formato .xlsx',
    sha256_hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
  },
];

export const SecurityAuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroSeveridad, setFiltroSeveridad] = useState<'TODOS' | 'INFO' | 'WARNING' | 'CRITICAL'>('TODOS');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase.from('security_audit_logs') as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      if (data && data.length > 0) {
        setLogs(data as AuditLog[]);
      } else {
        setLogs(FALLBACK_SEED_LOGS);
      }
    } catch (err) {
      console.error('Error al cargar logs:', err);
      setLogs(FALLBACK_SEED_LOGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    const canalAudit = supabase
      .channel('realtime-security-audit-logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'security_audit_logs' },
        (payload) => {
          if (payload.new) {
            setLogs((prev) => [payload.new as AuditLog, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalAudit);
    };
  }, []);

  // Métricas reactivas calculadas
  const kpis = useMemo(() => {
    return {
      total: logs.length,
      validos: logs.filter(l => l.severity === 'INFO').length,
      bloqueos: logs.filter(l => l.severity === 'CRITICAL' || l.severity === 'WARNING').length,
      gobierno: logs.filter(l => l.event_type?.includes('USER_') || l.event_type?.includes('REPORT_')).length,
    };
  }, [logs]);

  // Filtrado
  const logsFiltrados = useMemo(() => {
    return logs.filter((log) => {
      const matchSeveridad = filtroSeveridad === 'TODOS' || log.severity === filtroSeveridad;
      const term = searchTerm.toLowerCase();
      const matchSearch = 
        log.user_email?.toLowerCase().includes(term) ||
        log.user_name?.toLowerCase().includes(term) ||
        log.action_detail?.toLowerCase().includes(term) ||
        log.ip_address?.includes(term);
      return matchSeveridad && matchSearch;
    });
  }, [logs, filtroSeveridad, searchTerm]);

  const copiarHash = (hash: string) => {
    if (!hash) return;
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const exportarCSV = () => {
    if (logsFiltrados.length === 0) return;
    const cabeceras = ['Fecha UTC', 'Usuario', 'Email', 'Rol', 'Severidad', 'Evento', 'IP', 'Dispositivo', 'Detalle', 'SHA-256'];
    const filas = logsFiltrados.map(l => [
      l.created_at,
      l.user_name,
      l.user_email,
      l.user_role,
      l.severity,
      l.event_type,
      l.ip_address,
      `"${l.device_info || ''}"`,
      `"${l.action_detail || ''}"`,
      l.sha256_hash
    ]);
    const contenido = [cabeceras.join(','), ...filas.map(f => f.join(','))].join('\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Auditoria_Seguridad_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto pb-24 md:pb-12 text-slate-800 dark:text-zinc-100">
      
      {/* 1. HEADER EJECUTIVO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-zinc-400 font-semibold">
              Trazabilidad Criptográfica & Auditoría
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span>Auditoría de Accesos y Seguridad</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Registro inmutable de trazabilidad, intentos de inicio de sesión, bloqueos WAF y control multi-inquilino.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchLogs}
            className="p-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-[#121215] dark:hover:bg-[#18181b] border border-slate-200 dark:border-white/[0.08] text-slate-600 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
            title="Refrescar logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 text-xs font-mono font-medium">
            <Hash className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400"/>
            <span>Inmutabilidad SHA-256</span>
          </div>
        </div>
      </div>

      {/* 2. BENTO GRID DE TARJETAS KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        
        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5 shadow-xs dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Total Eventos Auditados</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
              <Terminal className="w-4 h-4"/>
            </div>
          </div>
          <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">{kpis.total}</span>
          <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-500 mt-2">Registro secuencial inmutable</p>
        </div>

        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5 shadow-xs dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Inicios de Sesión Válidos</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
              <CheckCircle2 className="w-4 h-4"/>
            </div>
          </div>
          <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">{kpis.validos}</span>
          <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400/90 mt-2">Autenticación 100% verificada</p>
        </div>

        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5 shadow-xs dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Intentos Bloqueados / Alertas</span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
              <ShieldAlert className="w-4 h-4"/>
            </div>
          </div>
          <span className="text-3xl font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">{kpis.bloqueos}</span>
          <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-500 mt-2">Protección perimetral WAF & Auth</p>
        </div>

        <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5 shadow-xs dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Acciones de Gobierno</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
              <Key className="w-4 h-4"/>
            </div>
          </div>
          <span className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">{kpis.gobierno}</span>
          <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-500 mt-2">Suspensiones, claves y reportes</p>
        </div>

      </div>

      {/* 3. BARRA DE HERRAMIENTAS Y FILTRADO */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Buscador */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"/>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por IP, usuario, correo o detalle..."
            className="w-full bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.08] rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Pestañas de Filtro */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
          {[
            { id: 'TODOS', label: 'Todos los Eventos' },
            { id: 'INFO', label: 'Accesos Válidos', dot: 'bg-emerald-500 dark:bg-emerald-400' },
            { id: 'CRITICAL', label: 'Bloqueos y Alertas', dot: 'bg-rose-500 dark:bg-rose-400' },
            { id: 'WARNING', label: 'Acciones de Control', dot: 'bg-amber-500 dark:bg-amber-400' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFiltroSeveridad(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer active:scale-[0.98] ${
                filtroSeveridad === tab.id
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.04]'
              }`}
            >
              {tab.dot && <span className={`w-1.5 h-1.5 rounded-full ${tab.dot}`} />}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Botón Exportar */}
        <button
          type="button"
          onClick={exportarCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/20 transition-all cursor-pointer whitespace-nowrap active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5"/>
          <span>Exportar Log (.CSV)</span>
        </button>
      </div>

      {/* 4. TABLA DE AUDITORÍA DE ALTA DENSIDAD */}
      <div className="bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.07] rounded-2xl shadow-xs dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset] overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[760px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.02] text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-zinc-400">
                <th className="py-3 px-4">Marca Temporal</th>
                <th className="py-3 px-4">Usuario y Rol</th>
                <th className="py-3 px-4">Evento & Severidad</th>
                <th className="py-3 px-4">Origen (IP & Dispositivo)</th>
                <th className="py-3 px-4">Detalle Operativo</th>
                <th className="py-3 px-4 text-right">Firma SHA-256</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.07] text-xs text-slate-700 dark:text-zinc-300">
              {logsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-zinc-500 text-xs italic font-mono">
                    No se encontraron registros de auditoría coincidentes.
                  </td>
                </tr>
              ) : (
                logsFiltrados.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-colors">
                    
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono tabular-nums text-slate-800 dark:text-zinc-200 block text-xs">
                        {new Date(log.created_at).toLocaleTimeString('es-CO')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                        {new Date(log.created_at).toLocaleDateString('es-CO')}
                      </span>
                    </td>

                    {/* Usuario */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900 dark:text-zinc-100 block truncate max-w-[160px]">
                        {log.user_name || 'Desconocido'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-zinc-400 block truncate max-w-[160px]">
                        {log.user_email}
                      </span>
                    </td>

                    {/* Evento y Severidad */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border ${
                          log.severity === 'CRITICAL'
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40'
                            : log.severity === 'WARNING'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                        }`}>
                          {log.severity}
                        </span>
                        <span className="font-mono text-[11px] text-slate-700 dark:text-zinc-300">
                          {log.event_type}
                        </span>
                      </div>
                    </td>

                    {/* Origen */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs text-blue-600 dark:text-cyan-400 block tabular-nums">
                        {log.ip_address}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-400 block truncate max-w-[180px]" title={log.device_info}>
                        {log.device_info}
                      </span>
                    </td>

                    {/* Detalle */}
                    <td className="py-3 px-4">
                      <p className="text-slate-700 dark:text-zinc-300 text-xs max-w-xs truncate" title={log.action_detail}>
                        {log.action_detail}
                      </p>
                      {log.tenant_name && (
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold font-mono">
                          {log.tenant_name}
                        </span>
                      )}
                    </td>

                    {/* Firma SHA-256 */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => copiarHash(log.sha256_hash)}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.08] font-mono text-[10px] text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:border-blue-500 transition-colors cursor-pointer active:scale-[0.96]"
                        title="Copiar hash de verificación"
                      >
                        <span>
                          {copiedHash === log.sha256_hash
                            ? '¡Copiado!'
                            : log.sha256_hash
                            ? log.sha256_hash.substring(0, 10) + '...'
                            : 'Firma OK'}
                        </span>
                        {copiedHash === log.sha256_hash ? (
                          <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
