import React, { useState } from 'react';
import { 
  Search, 
  RotateCw, 
  UserPlus, 
  ChevronLeft, 
  ChevronRight, 
  Loader2, 
  Building2,
  MessageCircle,
  Users
} from 'lucide-react';
import { useRealElectoresList } from './useRealElectoresList';
import { useTenant } from '../../context/TenantContext';

export interface LeaderVotesViewProps {
  isOwnerMode?: boolean;
  currentUserId?: string;
  activeTenantId?: string | null;
  onNavigateRegister: () => void;
  onOpenWhatsApp?: (elector: {
    id: string;
    nombres: string;
    telefono?: string | null;
    puesto_votacion: string;
    mesa: number;
  }) => void;
}

export const LeaderVotesListView: React.FC<LeaderVotesViewProps> = ({
  isOwnerMode = true,
  currentUserId,
  activeTenantId = null,
  onNavigateRegister,
  onOpenWhatsApp,
}) => {
  const { tenants } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string | null>(activeTenantId);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const { electores, totalCount, loading, refetch } = useRealElectoresList({
    isOwnerMode,
    selectedTenantId: selectedTenantFilter,
    currentUserId,
    page: currentPage,
    pageSize,
    searchQuery: searchTerm,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const handleWhatsAppClick = (elector: any) => {
    if (onOpenWhatsApp) {
      const mesaNum = parseInt(String(elector.mesa).replace(/\D/g, '') || '1', 10);
      onOpenWhatsApp({
        id: elector.id,
        nombres: elector.nombres,
        telefono: elector.telefono,
        puesto_votacion: elector.puesto_votacion,
        mesa: mesaNum,
      });
      return;
    }

    if (!elector.telefono || elector.telefono === '—') return;
    const cleanPhone = String(elector.telefono).replace(/\D/g, '');
    const phoneWithCode = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;
    const msg = encodeURIComponent(
      `¡Hola ${elector.nombres}! Te confirmamos que tu puesto de votación es ${elector.puesto_votacion}, ${elector.mesa}. ¡Contamos con tu apoyo!`
    );
    window.open(`https://wa.me/${phoneWithCode}?text=${msg}`, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 space-y-4 transition-colors">
      
      {/* 1. Barra de Búsqueda, Filtro de Campaña y Acciones */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Input de Búsqueda */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por cédula, nombre completo o puesto de votación..."
            className="w-full bg-white dark:bg-[#060a14] border border-slate-200 dark:border-[#162345] rounded-2xl pl-11 pr-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all shadow-sm"
          />
        </div>

        {/* Controles de Acción y Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector sutil de campaña exclusiva para Modo Propietario */}
          {isOwnerMode && tenants && tenants.length > 0 && (
            <div className="relative flex items-center">
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <select
                value={selectedTenantFilter || ''}
                onChange={(e) => {
                  setSelectedTenantFilter(e.target.value || null);
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-[#0b1328] border border-slate-200 dark:border-[#162345] rounded-xl pl-8 pr-7 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer shadow-sm appearance-none"
              >
                <option value="">Todas las Campañas (Global)</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-2.5 pointer-events-none text-[10px] text-slate-400">▾</div>
            </div>
          )}

          {/* Botón Refrescar */}
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-[#162345] bg-white dark:bg-[#0b1328] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#121c33] transition-colors cursor-pointer"
            title="Refrescar datos en vivo"
          >
            <RotateCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
          </button>

          {/* Pill Sincronizado */}
          <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sincronizado
          </span>

          {/* Botón Registrar Nuevo */}
          <button
            onClick={onNavigateRegister}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/25 transition-all cursor-pointer active:scale-98"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Registrar Nuevo</span>
          </button>
        </div>
      </div>

      {/* 2. Tabla de Datos Reales */}
      <div className="bg-white dark:bg-[#070b14] border border-slate-200 dark:border-[#162345] rounded-3xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#162345] bg-slate-50/70 dark:bg-[#0b1328]/60 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider">
                <th className="py-3.5 px-4">Documento</th>
                <th className="py-3.5 px-4">Nombre Completo</th>
                <th className="py-3.5 px-4">Teléfono</th>
                <th className="py-3.5 px-4">Puesto de Votación</th>
                <th className="py-3.5 px-4">Mesa</th>
                <th className="py-3.5 px-4">Registrado Por</th>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#121c33] text-slate-800 dark:text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <span className="font-medium">Cargando registros reales de la base de datos...</span>
                  </td>
                </tr>
              ) : electores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-[#0f172a] text-slate-400 flex items-center justify-center mx-auto">
                        <Users className="w-5 h-5" />
                      </div>
                      <p className="font-bold text-slate-800 dark:text-white">No se encontraron registros</p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {searchTerm
                          ? 'No hay electores que coincidan con la búsqueda.'
                          : 'Aún no hay votantes registrados en la base de datos.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                electores.map((elector) => (
                  <tr
                    key={elector.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-[#0d162a] transition-colors"
                  >
                    {/* Cédula */}
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-sky-400">
                      {elector.cedula}
                    </td>

                    {/* Nombre Completo */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white">
                      {elector.nombres} {elector.apellidos}
                    </td>

                    {/* Teléfono */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {elector.telefono}
                    </td>

                    {/* Puesto */}
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {elector.puesto_votacion}
                    </td>

                    {/* Mesa */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                      {elector.mesa}
                    </td>

                    {/* Registrado por */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {elector.registrado_por}
                        </span>
                        {isOwnerMode && elector.campana_nombre && (
                          <span className="text-[10px] text-slate-400">
                            {elector.campana_nombre}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Fecha */}
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {elector.created_at}
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-center">
                      {elector.telefono && elector.telefono !== '—' ? (
                        <button
                          onClick={() => handleWhatsAppClick(elector)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 transition-all text-[11px] font-semibold cursor-pointer"
                          title="Contactar por WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 3. Paginación Inferior */}
        <div className="p-4 border-t border-slate-200 dark:border-[#162345] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Mostrando{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {electores.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </strong>{' '}
            -{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(currentPage * pageSize, totalCount)}
            </strong>{' '}
            de{' '}
            <strong className="text-slate-800 dark:text-slate-200">{totalCount}</strong>{' '}
            registros reales
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono px-2 text-slate-700 dark:text-slate-300">
              Página {currentPage} de {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
