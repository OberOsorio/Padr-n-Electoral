import { useState } from 'react';
import { useElectorsList } from './useElectorsList';
import { EditElectorModal } from './components/EditElectorModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { ElectorsDataTable } from './ElectorsDataTable';
import type { ElectorWithRegistrant } from '../../types';
import {
  Search,
  MapPin,
  UserCheck,
  RefreshCw,
  Users,
  X,
  UploadCloud,
} from 'lucide-react';

interface ElectorsListViewProps {
  onNavigateToRegister?: () => void;
  onNavigateToBulkUpload?: () => void;
  isAdmin?: boolean;
}

export const ElectorsListView = ({
  onNavigateToRegister,
  onNavigateToBulkUpload,
  isAdmin = true,
}: ElectorsListViewProps) => {
  // Estados para búsqueda y filtros
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [puestoFilter, setPuestoFilter] = useState('all');
  const [coordinadorFilter, setCoordinadorFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Estados para modales de edición y eliminación
  const [editingElector, setEditingElector] = useState<ElectorWithRegistrant | null>(null);
  const [deletingElector, setDeletingElector] = useState<ElectorWithRegistrant | null>(null);

  // Consulta reactiva con Supabase
  const {
    electors,
    totalCount,
    coordinatorsList,
    pollingPlacesList,
    loading,
    error,
    deleteElector,
    updateElector,
    refetch,
  } = useElectorsList(
    debouncedSearch,
    puestoFilter,
    coordinadorFilter,
    currentPage,
    pageSize
  );

  // Manejo de debounce para la búsqueda
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    setCurrentPage(1); // Reiniciar a la primera página al buscar
    const timer = setTimeout(() => {
      setDebouncedSearch(val);
    }, 300);
    return () => clearTimeout(timer);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setCurrentPage(1);
  };



  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto pb-24 md:pb-10 animate-in fade-in duration-300">
      
      {/* 1. Header de Vista Ejecutivo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-700/60">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Padrón / Lista de Electores
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 mt-1">
            Visualización de alta densidad, búsqueda server-side y contacto rápido.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Totalizador de registros encontrados */}
          <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-200 flex items-center gap-2 shadow-xs">
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-mono font-semibold text-slate-900 dark:text-[#F8FAFC]">
              {totalCount.toLocaleString()}
            </span>
            <span className="text-slate-500 dark:text-slate-400">registrados</span>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shadow-xs"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {onNavigateToBulkUpload && (
            <button
              type="button"
              onClick={onNavigateToBulkUpload}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <UploadCloud className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Carga Masiva</span>
            </button>
          )}

          {onNavigateToRegister && (
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="px-3.5 sm:px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <span>+ Nuevo Elector</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Barra de Filtros y Búsqueda */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 p-4 rounded-2xl bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 shadow-xs dark:shadow-xl transition-colors">
        {/* Barra de Búsqueda Rápida */}
        <div className="md:col-span-5 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por cédula, nombres o apellidos..."
            className="w-full h-10 pl-10 pr-9 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500/40 transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtro por Puesto de Votación */}
        <div className="md:col-span-3 relative">
          <select
            value={puestoFilter}
            onChange={(e) => {
              setPuestoFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-10 pl-3.5 pr-8 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
          >
            <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
              Todos los Puestos
            </option>
            {pollingPlacesList.map((p) => (
              <option key={p} value={p} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                {p}
              </option>
            ))}
          </select>
          <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-400 pointer-events-none" />
        </div>

        {/* Filtro por Coordinador */}
        <div className="md:col-span-3 relative">
          <select
            value={coordinadorFilter}
            onChange={(e) => {
              setCoordinadorFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full h-10 pl-3.5 pr-8 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
          >
            <option value="all" className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
              Todos los Coordinadores
            </option>
            {coordinatorsList.map((c) => (
              <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                {c.name}
              </option>
            ))}
          </select>
          <UserCheck className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-400 pointer-events-none" />
        </div>

        {/* Selector de Tamaño de Página */}
        <div className="md:col-span-1">
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="w-full h-10 px-2 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer text-center"
          >
            <option value={10} className="bg-white dark:bg-slate-900">10 / pág</option>
            <option value={25} className="bg-white dark:bg-slate-900">25 / pág</option>
            <option value={50} className="bg-white dark:bg-slate-900">50 / pág</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl text-xs text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* 3. Tabla Ejecutiva de Alta Densidad */}
      <ElectorsDataTable
        electors={electors}
        loading={loading}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onEdit={(elector) => setEditingElector(elector)}
        onDelete={(elector) => setDeletingElector(elector)}
        isAdmin={isAdmin}
        emptyMessage={
          searchInput || puestoFilter !== 'all' || coordinadorFilter !== 'all'
            ? 'No hay registros que coincidan con los filtros aplicados. Intente restablecer los criterios de búsqueda.'
            : 'Aún no se han inscrito ciudadanos en el padrón electoral.'
        }
      />

      {/* Modales */}
      <EditElectorModal
        elector={editingElector}
        isOpen={Boolean(editingElector)}
        onClose={() => setEditingElector(null)}
        onSave={updateElector}
      />

      <DeleteConfirmModal
        elector={deletingElector}
        isOpen={Boolean(deletingElector)}
        onClose={() => setDeletingElector(null)}
        onConfirm={deleteElector}
      />
    </div>
  );
};
