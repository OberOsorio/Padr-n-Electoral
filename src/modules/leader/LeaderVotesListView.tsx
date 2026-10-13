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
  Users,
  Pencil,
  Trash2,
  X,
  Save,
  AlertTriangle
} from 'lucide-react';
import { useRealElectoresList } from './useRealElectoresList';
import { useTenant } from '../../context/TenantContext';
import { supabase } from '../../services/supabase';

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

  // Estados para Edición y Eliminación de Raíz
  const [electorEditando, setElectorEditando] = useState<any | null>(null);
  const [electorAEliminar, setElectorAEliminar] = useState<any | null>(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [eliminandoRaiz, setEliminandoRaiz] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // 1. ELIMINACIÓN DIRECTA DE RAÍZ EN SUPABASE (HARD DELETE)
  const handleEliminarDeRaiz = async () => {
    if (!electorAEliminar) return;

    try {
      setEliminandoRaiz(true);
      setModalError(null);

      const { error } = await supabase
        .from('electores')
        .delete()
        .eq('id', electorAEliminar.id);

      if (error) throw error;

      // Cerrar modal y refrescar la tabla en tiempo real
      setElectorAEliminar(null);
      await refetch();
    } catch (err: any) {
      console.error('Error al eliminar elector de raíz:', err);
      setModalError(`No se pudo eliminar el registro: ${err.message || 'Error desconocido'}`);
    } finally {
      setEliminandoRaiz(false);
    }
  };

  // 2. ACTUALIZACIÓN DIRECTA EN SUPABASE (UPDATE)
  const handleGuardarEdicion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!electorEditando) return;

    try {
      setGuardandoEdicion(true);
      setModalError(null);

      const edadNum = electorEditando.edad
        ? parseInt(String(electorEditando.edad).replace(/\D/g, ''), 10)
        : null;
      const mesaNum = electorEditando.mesa
        ? parseInt(String(electorEditando.mesa).replace(/\D/g, ''), 10)
        : null;

      const { error } = await (supabase.from('electores') as any)
        .update({
          nombres: electorEditando.nombres.trim(),
          apellidos: electorEditando.apellidos.trim(),
          telefono: electorEditando.telefono?.trim() || null,
          edad: !isNaN(Number(edadNum)) ? edadNum : null,
          puesto_votacion: electorEditando.puesto_votacion?.trim() || null,
          mesa: !isNaN(Number(mesaNum)) ? mesaNum : null,
          notas: electorEditando.observaciones?.trim() || electorEditando.notas?.trim() || null,
        })
        .eq('id', electorEditando.id);

      if (error) throw error;

      setElectorEditando(null);
      await refetch();
    } catch (err: any) {
      console.error('Error al actualizar elector:', err);
      setModalError(`No se pudo actualizar el registro: ${err.message || 'Error desconocido'}`);
    } finally {
      setGuardandoEdicion(false);
    }
  };

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
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-[#162345] bg-slate-50/75 dark:bg-[#0b1328]/80 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider font-mono">
                <th className="py-3 px-4">DOCUMENTO</th>
                <th className="py-3 px-4">NOMBRE COMPLETO</th>
                <th className="py-3 px-4">TELÉFONO</th>
                <th className="py-3 px-4">PUESTO DE VOTACIÓN</th>
                <th className="py-3 px-4">MESA</th>
                <th className="py-3 px-4">REGISTRADO POR</th>
                <th className="py-3 px-4">FECHA</th>
                <th className="py-3 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#162345]/50">
              {loading && electores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <span>Cargando registros reales de la base de datos...</span>
                  </td>
                </tr>
              ) : electores.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      No se encontraron electores en este entorno
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Usa el botón "+ Registrar Nuevo" para agregar votantes a tu equipo.
                    </p>
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
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp (si tiene teléfono) */}
                        {elector.telefono && elector.telefono !== '—' && (
                          <button
                            type="button"
                            onClick={() => handleWhatsAppClick(elector)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 dark:text-emerald-400 transition-colors cursor-pointer"
                            title="Contactar por WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Botón Editar */}
                        <button
                          type="button"
                          onClick={() => {
                            setModalError(null);
                            const cleanMesa = elector.rawMesa != null 
                              ? String(elector.rawMesa) 
                              : elector.mesa ? String(elector.mesa).replace(/\D/g, '') : '';
                            setElectorEditando({
                              ...elector,
                              mesa: cleanMesa,
                              observaciones: elector.notas || elector.observaciones || '',
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 dark:text-slate-400 dark:hover:text-sky-400 transition-colors cursor-pointer"
                          title="Editar información"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Botón Eliminar de Raíz */}
                        <button
                          type="button"
                          onClick={() => {
                            setModalError(null);
                            setElectorAEliminar(elector);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Eliminar de raíz de la base de datos"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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

      {/* --- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE RAÍZ --- */}
      {electorAEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0b1328] border border-slate-200 dark:border-[#162345] rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  ¿Eliminar elector de raíz?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#060a14] p-3 rounded-xl border border-slate-100 dark:border-[#1a2b50]">
              Se borrará definitivamente el registro de <strong>{electorAEliminar.nombres} {electorAEliminar.apellidos}</strong> (C.C. {electorAEliminar.cedula}) de la base de datos de Supabase.
            </p>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {modalError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={eliminandoRaiz}
                onClick={() => setElectorAEliminar(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={eliminandoRaiz}
                onClick={handleEliminarDeRaiz}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {eliminandoRaiz ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{eliminandoRaiz ? 'Borrando...' : 'Sí, eliminar de raíz'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE EDICIÓN FLOTANTE --- */}
      {electorEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#0b1328] border border-slate-200 dark:border-[#162345] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#162345]">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-blue-600 dark:text-sky-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Editar Elector (C.C. {electorEditando.cedula})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setElectorEditando(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleGuardarEdicion} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] block mb-1">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    required
                    value={electorEditando.nombres || ''}
                    onChange={(e) => setElectorEditando({ ...electorEditando, nombres: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#060a14] border border-slate-200 dark:border-[#1a2b50] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] block mb-1">
                    Apellidos *
                  </label>
                  <input
                    type="text"
                    required
                    value={electorEditando.apellidos || ''}
                    onChange={(e) => setElectorEditando({ ...electorEditando, apellidos: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#060a14] border border-slate-200 dark:border-[#1a2b50] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] block mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={electorEditando.telefono !== '—' ? (electorEditando.telefono || '') : ''}
                    onChange={(e) => setElectorEditando({ ...electorEditando, telefono: e.target.value })}
                    placeholder="3001234567"
                    className="w-full bg-slate-50 dark:bg-[#060a14] border border-slate-200 dark:border-[#1a2b50] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] block mb-1">
                    Edad
                  </label>
                  <input
                    type="number"
                    value={electorEditando.edad || ''}
                    onChange={(e) => setElectorEditando({ ...electorEditando, edad: e.target.value })}
                    placeholder="Ej. 35"
                    className="w-full bg-slate-50 dark:bg-[#060a14] border border-slate-200 dark:border-[#1a2b50] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] block mb-1">
                    Puesto de Votación
                  </label>
                  <input
                    type="text"
                    value={electorEditando.puesto_votacion !== 'No asignado' ? (electorEditando.puesto_votacion || '') : ''}
                    onChange={(e) => setElectorEditando({ ...electorEditando, puesto_votacion: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#060a14] border border-slate-200 dark:border-[#1a2b50] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] block mb-1">
                    Mesa
                  </label>
                  <input
                    type="text"
                    value={electorEditando.mesa || ''}
                    onChange={(e) => setElectorEditando({ ...electorEditando, mesa: e.target.value })}
                    placeholder="Ej: 2"
                    className="w-full bg-slate-50 dark:bg-[#060a14] border border-slate-200 dark:border-[#1a2b50] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 dark:text-slate-400 uppercase text-[10px] block mb-1">
                  Observaciones / Notas
                </label>
                <textarea
                  rows={2}
                  value={electorEditando.observaciones || ''}
                  onChange={(e) => setElectorEditando({ ...electorEditando, observaciones: e.target.value })}
                  placeholder="Anotaciones de seguimiento o compromiso..."
                  className="w-full bg-slate-50 dark:bg-[#060a14] border border-slate-200 dark:border-[#1a2b50] rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#162345]">
                <button
                  type="button"
                  disabled={guardandoEdicion}
                  onClick={() => setElectorEditando(null)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="px-4 py-2 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  {guardandoEdicion ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{guardandoEdicion ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
