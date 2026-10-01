import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Users,
  Activity,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { useUsersTree } from './useUsersTree';
import { UserTreeNode } from './UserTreeNode';

export const MasterUsersView: React.FC = () => {
  const { treeData, allUsersList, loading, refetch, toggleUserStatus } = useUsersTree();
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [collapsedCampaigns, setCollapsedCampaigns] = useState<Record<string, boolean>>({});

  const showNotify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastType(type);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Calcular métricas globales
  const totalUsuariosGlobal = useMemo(() => {
    return treeData.reduce((acc, g) => acc + g.totalUsuarios, 0);
  }, [treeData]);

  const activeUsersGlobal = useMemo(() => {
    return allUsersList.filter(u => u.is_active).length;
  }, [allUsersList]);

  // Identificar IDs que coinciden con la búsqueda para auto-expandir el árbol
  const searchMatchIds = useMemo(() => {
    if (!searchTerm.trim()) return new Set<string>();
    const term = searchTerm.toLowerCase().trim();
    const matched = new Set<string>();

    allUsersList.forEach((u) => {
      if (
        u.full_name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.role.toLowerCase().includes(term)
      ) {
        matched.add(u.id);
      }
    });

    return matched;
  }, [searchTerm, allUsersList]);

  // Manejador para alternar estado activo/suspendido con feedback
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    const res = await toggleUserStatus(userId, currentStatus);
    if (res.success) {
      showNotify(
        currentStatus ? 'Acceso de usuario suspendido.' : 'Acceso de usuario reactivado con éxito.',
        'success'
      );
    }
  };

  const toggleCampaignCollapse = (tenantId: string) => {
    setCollapsedCampaigns((prev) => ({
      ...prev,
      [tenantId]: !prev[tenantId],
    }));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-3 sm:p-5 md:p-6 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl text-xs font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200 border ${
            toastType === 'error'
              ? 'bg-rose-950/90 border-rose-500/40 text-rose-200'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
          }`}
        >
          <CheckCircle2
            className={`w-4 h-4 shrink-0 ${
              toastType === 'error' ? 'text-rose-400' : 'text-emerald-400'
            }`}
          />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cabecera Principal y Tarjetas de Resumen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-600/15 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Estructura Jerárquica y Usuarios Globales
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Visualización y administración en árbol por Campaña &gt; Directores &gt; Coordinadores &gt; Líderes.
          </p>
        </div>

        {/* Acciones y Búsqueda */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar líder, coordinador o email..."
              className="w-full bg-white dark:bg-[#080d1a] border border-slate-200 dark:border-[#162342] rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={loading}
            className="p-2 rounded-xl bg-white dark:bg-[#080d1a] border border-slate-200 dark:border-[#162342] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Recargar árbol"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500 dark:text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Micro KPIs de Estructura */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white dark:bg-[#090f1e] border border-slate-200 dark:border-[#162342] rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              Campañas en Red
            </span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{treeData.length}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#090f1e] border border-slate-200 dark:border-[#162342] rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              Total Integrantes en Jerarquía
            </span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{totalUsuariosGlobal}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#090f1e] border border-slate-200 dark:border-[#162342] rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              Usuarios Activos
            </span>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {activeUsersGlobal}
              <span className="text-xs text-slate-500 ml-1 font-normal">
                / {allUsersList.length - activeUsersGlobal} susp.
              </span>
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
            <Activity className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Estado de Carga */}
      {loading && treeData.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-[#060b17] border border-slate-200 dark:border-[#15223e] rounded-3xl">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cargando jerarquía operativa de campañas...</p>
        </div>
      )}

      {/* Listado de Campañas con Árbol Desplegable */}
      <div className="space-y-5">
        {treeData.map((grupo) => {
          const isCollapsed = collapsedCampaigns[grupo.tenantId] || false;

          return (
            <div
              key={grupo.tenantId}
              className="bg-white dark:bg-[#060b17] border border-slate-200 dark:border-[#15223e] rounded-3xl p-4 sm:p-5 shadow-sm dark:shadow-xl transition-all"
            >
              {/* Header de la Campaña (Raíz del Árbol) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-3 border-b border-slate-200 dark:border-[#141e36]">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleCampaignCollapse(grupo.tenantId)}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title={isCollapsed ? 'Desplegar campaña' : 'Colapsar campaña'}
                  >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <div className="p-2 rounded-2xl bg-purple-50 dark:bg-purple-600/15 border border-purple-200 dark:border-purple-500/25 text-purple-600 dark:text-purple-400 shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                        {grupo.tenantName}
                      </h3>
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded-md">
                        {grupo.municipio}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                      ID: {grupo.tenantId}
                    </span>
                  </div>
                </div>

                {/* Métricas del Grupo / Campaña */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-[#091124] border border-slate-200 dark:border-[#1b2b52] text-slate-700 dark:text-slate-300">
                    <strong className="text-slate-900 dark:text-white">{grupo.totalUsuarios}</strong> integrantes
                  </span>
                </div>
              </div>

              {/* Contenido del Árbol Jerárquico de Usuarios */}
              {!isCollapsed && (
                <div className="space-y-1 pt-1">
                  {grupo.directores.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-xs text-slate-500 italic mb-2">
                        No hay usuarios registrados en esta campaña todavía.
                      </p>
                    </div>
                  ) : (
                    grupo.directores.map((director) => (
                      <UserTreeNode
                        key={director.id}
                        node={director}
                        level={0}
                        onToggleStatus={handleToggleStatus}
                        onNotify={showNotify}
                        searchMatchIds={searchMatchIds}
                        searchTerm={searchTerm}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {treeData.length === 0 && !loading && (
          <div className="p-12 text-center bg-white dark:bg-[#060b17] border border-slate-200 dark:border-[#15223e] rounded-3xl">
            <Building2 className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No hay campañas registradas</h4>
            <p className="text-xs text-slate-500 mt-1">
              Crea una campaña en la sección &ldquo;Campañas y Clientes&rdquo; para comenzar a estructurar el equipo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
