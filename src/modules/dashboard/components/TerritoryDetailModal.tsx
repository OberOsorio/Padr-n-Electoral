import React, { useState, useMemo } from 'react';
import {
  MapPin,
  X,
  Users,
  Search,
  ExternalLink,
  FileSpreadsheet,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { PuestoMetrica, PuestoElectorItem } from '../TerritoryDistributionCard';

interface TerritoryDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  puesto: PuestoMetrica | null;
  nombreCircunscripcion?: string;
  onNavigateToElectorFilter?: (puestoNombre: string) => void;
}

export function formatCedula(cedula: string | number | undefined | null): string {
  if (!cedula) return '-';
  const clean = String(cedula).replace(/\D/g, '');
  if (!clean) return String(cedula);
  return Number(clean).toLocaleString('es-CO');
}

export const TerritoryDetailModal: React.FC<TerritoryDetailModalProps> = ({
  isOpen,
  onClose,
  puesto,
  nombreCircunscripcion = 'Campaña Municipal',
  onNavigateToElectorFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [mesaFilter, setMesaFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  // Filtrado de electores dentro del modal
  const filteredElectors = useMemo(() => {
    if (!puesto?.electores) return [];
    return puesto.electores.filter((elector) => {
      const matchSearch =
        searchTerm.trim() === '' ||
        elector.cedula.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        `${elector.nombres} ${elector.apellidos}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase().trim()) ||
        (elector.liderNombre &&
          elector.liderNombre.toLowerCase().includes(searchTerm.toLowerCase().trim()));

      const matchMesa =
        mesaFilter === 'all' ||
        String(elector.mesa) === String(mesaFilter);

      return matchSearch && matchMesa;
    });
  }, [puesto, searchTerm, mesaFilter]);

  // Lista de mesas únicas para el filtro
  const availableMesas = useMemo(() => {
    if (!puesto?.electores) return [];
    const set = new Set<string>();
    puesto.electores.forEach((e) => {
      if (e.mesa !== undefined && e.mesa !== null && e.mesa !== '') {
        set.add(String(e.mesa));
      }
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [puesto]);

  // Exportar a Excel (.xlsx) nativo
  const handleExportExcel = () => {
    if (!puesto) return;
    setIsExporting(true);
    try {
      const dataToExport = (puesto.electores || []).map((e: PuestoElectorItem, index: number) => ({
        '#': index + 1,
        'Cédula': e.cedula,
        'Nombres': e.nombres,
        'Apellidos': e.apellidos,
        'Edad': e.edad ?? 'N/A',
        'Teléfono': e.telefono || 'Sin registrar',
        'Puesto de Votación': puesto.nombrePuesto,
        'Zona': puesto.zona,
        'Mesa de Votación': e.mesa ? `Mesa ${e.mesa}` : 'Sin asignar',
        'Líder Responsable': e.liderNombre || 'Líder Operativo',
        'Fecha de Registro': e.created_at
          ? new Date(e.created_at).toLocaleDateString('es-CO', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : 'N/A',
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Electores');

      // Nombre amigable para el archivo
      const cleanName = puesto.nombrePuesto.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const filename = `territorio_${cleanName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error('Error al exportar territorio a Excel:', err);
      alert('Hubo un problema al generar el archivo Excel.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleGoToPadron = () => {
    if (!puesto) return;
    onClose();
    if (onNavigateToElectorFilter) {
      onNavigateToElectorFilter(puesto.nombrePuesto);
    }
  };

  if (!isOpen || !puesto) return null;

  const totalMesasActivas = puesto.totalMesas || puesto.mesas?.length || (availableMesas.length > 0 ? availableMesas.length : 1);
  const promedioElectores =
    puesto.promedioElectoresPorMesa ??
    (puesto.totalElectores > 0
      ? Math.round((puesto.totalElectores / totalMesasActivas) * 10) / 10
      : 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#0a1224] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-[#15223e] shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* 1. CABECERA EJECUTIVA */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-[#15223e] flex items-center justify-between bg-slate-50/70 dark:bg-[#070D1F]/50 shrink-0">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white shadow-md shadow-blue-500/20 shrink-0">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {puesto.nombrePuesto}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                    puesto.zona === 'RURAL'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40'
                      : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40'
                  }`}
                >
                  {puesto.zona === 'RURAL' ? 'Zona Rural' : 'Cabecera Urbana'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                  Activo
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                Circunscripción: <strong className="text-slate-700 dark:text-slate-200">{nombreCircunscripcion}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. MÉTRICAS CLAVE DEL PUESTO */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 p-3.5 sm:p-5 bg-slate-50/30 dark:bg-[#0a1224] border-b border-slate-100 dark:border-[#15223e] shrink-0">
          <div className="p-3 rounded-2xl bg-white dark:bg-[#070D1F] border border-slate-200/80 dark:border-[#15223e] shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Total Electores
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {puesto.totalElectores}
              </span>
              <span className="text-[11px] text-blue-600 dark:text-cyan-400 font-semibold">
                ({puesto.porcentaje}%)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-[#070D1F] border border-slate-200/80 dark:border-[#15223e] shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Mesas con Votantes
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {totalMesasActivas}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {totalMesasActivas === 1 ? 'mesa activa' : 'mesas activas'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-[#070D1F] border border-slate-200/80 dark:border-[#15223e] shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Promedio x Mesa
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {promedioElectores}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                electores/m
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white dark:bg-[#070D1F] border border-slate-200/80 dark:border-[#15223e] shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Líderes Activos
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {puesto.lideresNombres?.length || 1}
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                {puesto.lideresNombres?.[0] || 'En territorio'}
              </span>
            </div>
          </div>
        </div>

        {/* 3. BARRA DE BÚSQUEDA Y FILTRO INTERNO */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-[#15223e] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#0a1224] shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cédula, nombre o líder..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={mesaFilter}
              onChange={(e) => setMesaFilter(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Todas las mesas ({puesto.totalElectores})</option>
              {availableMesas.map((m) => (
                <option key={m} value={m}>
                  Mesa {m}
                </option>
              ))}
            </select>

            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 whitespace-nowrap hidden sm:inline">
              {filteredElectors.length} de {puesto.totalElectores}
            </span>
          </div>
        </div>

        {/* 4. TABLA DE ELECTORES (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[460px] p-3.5 sm:p-5">
          {filteredElectors.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No se encontraron electores en este puesto
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                {searchTerm || mesaFilter !== 'all'
                  ? 'Ningún elector coincide con los criterios de búsqueda o mesa seleccionada.'
                  : 'Aún no se han vinculado votantes a este puesto de votación.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-[#15223e]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#070D1F] border-b border-slate-200 dark:border-[#15223e] text-slate-500 dark:text-slate-400 font-semibold">
                    <th className="py-2.5 px-3 font-mono text-[11px]">#</th>
                    <th className="py-2.5 px-3">Cédula</th>
                    <th className="py-2.5 px-3">Nombre Completo</th>
                    <th className="py-2.5 px-3 text-center">Edad</th>
                    <th className="py-2.5 px-3 text-center">Mesa</th>
                    <th className="py-2.5 px-3">Líder que Registró</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#15223e]">
                  {filteredElectors.map((elector, idx) => (
                    <tr
                      key={elector.id || idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {formatCedula(elector.cedula)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                        {elector.nombres} {elector.apellidos}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-600 dark:text-slate-400">
                        {elector.edad ? `${elector.edad} años` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 font-bold font-mono text-[10px] border border-blue-200 dark:border-blue-800/40">
                          {elector.mesa ? `M-${elector.mesa}` : 'Pendiente'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5 truncate max-w-[190px]">
                          <UserCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">{elector.liderNombre || 'Líder Operativo'}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 5. PIE DE ACCIONES DIRECTAS */}
        <div className="p-3.5 sm:p-5 border-t border-slate-100 dark:border-[#15223e] bg-slate-50/50 dark:bg-[#070D1F]/50 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 self-start sm:self-center">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              Padrón auditado: <strong>{puesto.totalElectores}</strong> electores en <strong>{puesto.nombrePuesto}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleExportExcel}
              disabled={isExporting || (puesto.electores?.length || 0) === 0}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0a1224] hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Exportar Excel</span>
            </button>

            <button
              type="button"
              onClick={handleGoToPadron}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all cursor-pointer touch-manipulation active:scale-95"
            >
              <span>Ver en Padrón</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
