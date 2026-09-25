import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ElectorsDataTable } from '../electors/ElectorsDataTable';
import type { ElectorWithRegistrant } from '../../types';

export interface LeaderMyElectorsViewProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filteredElectors: ElectorWithRegistrant[];
  loading: boolean;
  onNavigateToRegister: () => void;
  onOpenWhatsApp: (elector: {
    id: string;
    nombres: string;
    telefono?: string | null;
    puesto_votacion: string;
    mesa: number;
  }) => void;
  onEdit?: (elector: ElectorWithRegistrant) => void;
  onDelete?: (elector: ElectorWithRegistrant) => void;
}

export const LeaderMyElectorsView: React.FC<LeaderMyElectorsViewProps> = ({
  searchQuery,
  setSearchQuery,
  filteredElectors,
  loading,
  onNavigateToRegister,
  onOpenWhatsApp,
  onEdit,
  onDelete,
}) => {
  // Paginación local para la vista de líder
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Electores paginados según el filtro y página actual
  const paginatedElectors = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredElectors.slice(start, start + pageSize);
  }, [filteredElectors, currentPage, pageSize]);

  return (
    <motion.div
      key="tab-list"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="space-y-3.5"
    >
      {/* 1. Barra de Control: Buscador y Acciones Superiores */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Input de Búsqueda Instantánea */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por cédula, nombre completo o puesto de votación..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800/90 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all shadow-xs dark:shadow-sm focus:outline-none"
          />
        </div>

        {/* Botón de Registro Rápido */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            Sincronizado
          </span>

          <button
            type="button"
            onClick={onNavigateToRegister}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-600/25 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>+ Registrar Nuevo</span>
          </button>
        </div>
      </div>

      {/* 2. Tabla Corporativa Densa Exacta */}
      <ElectorsDataTable
        electors={paginatedElectors}
        loading={loading}
        totalCount={filteredElectors.length}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onEdit={onEdit}
        onDelete={onDelete}
        onWhatsApp={onOpenWhatsApp}
        isAdmin={true}
        emptyMessage={
          searchQuery
            ? 'No se encontraron electores que coincidan con la búsqueda ingresada.'
            : 'Aún no has registrado votantes a tu nombre en esta campaña. ¡Comienza ahora!'
        }
      />
    </motion.div>
  );
};
