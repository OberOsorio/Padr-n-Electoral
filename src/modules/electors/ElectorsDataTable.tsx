import React, { useState } from 'react';
import {
  MessageSquare,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Phone,
  MapPin,
  LayoutGrid,
  List,
} from 'lucide-react';
import type { ElectorWithRegistrant } from '../../types';

export interface ElectorsDataTableProps {
  electors: ElectorWithRegistrant[];
  loading?: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit?: (elector: ElectorWithRegistrant) => void;
  onDelete?: (elector: ElectorWithRegistrant) => void;
  onWhatsApp?: (elector: ElectorWithRegistrant) => void;
  isAdmin?: boolean;
  emptyMessage?: string;
  selectedIds?: string[];
  onToggleSelectOne?: (id: string) => void;
  onToggleSelectAll?: () => void;
  onClearSelection?: () => void;
  onBulkDelete?: () => void;
  isDeletingBulk?: boolean;
}

/**
 * Aplica formato de miles a la cédula colombiana para facilitar su lectura rápida
 */
const formatearCedula = (cc: string | number) => {
  if (!cc) return '';
  const num = cc.toString().replace(/\D/g, '');
  return new Intl.NumberFormat('es-CO').format(Number(num));
};

/**
 * Formatea fechas a formato ultra compacto (ej: '28 sep')
 */
const formatearFechaUltraCorta = (isoString?: string) => {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    const months = [
      'ene', 'feb', 'mar', 'abr', 'may', 'jun',
      'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
    ];
    const day = d.getDate();
    const month = months[d.getMonth()];
    return `${day} ${month}`;
  } catch {
    return '—';
  }
};

/**
 * Limpia y normaliza el nombre del puesto de votación
 */
function formatearPuestoSimple(puesto?: string | null): { titulo: string; detalle: string } {
  if (!puesto) {
    return { titulo: 'Sin puesto asignado', detalle: 'Cabecera' };
  }

  let raw = puesto.trim();
  let titulo = raw;
  let detalle = '';

  if (raw.includes(' - ') || raw.includes(' – ') || raw.includes(' — ')) {
    const parts = raw.split(/\s*[-–—]\s*/);
    titulo = parts[0].trim();
    detalle = parts.slice(1).join(' • ').trim();
  } else if (raw.includes(' / ')) {
    const parts = raw.split(/\s*\/\s*/);
    titulo = parts[0].trim();
    detalle = parts.slice(1).join(' • ').trim();
  } else if (/\s+CGTO\b/i.test(raw)) {
    const match = raw.match(/^(.*?)\s+(CGTO\b.*)$/i);
    if (match) {
      titulo = match[1].trim();
      detalle = match[2].trim();
    }
  }

  titulo = titulo
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\bBONGO\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (/M\.?D\.?\s+CL\s+P\/?PAL/i.test(detalle)) {
    detalle = detalle.replace(/M\.?D\.?\s+CL\s+P\/?PAL/gi, '• Rural');
  }

  detalle = detalle
    .replace(/CGTO\b\.?/gi, 'Corregimiento')
    .replace(/VDA\b\.?/gi, 'Vereda')
    .replace(/P\/PAL|PPAL\b\.?/gi, 'Principal')
    .replace(/CAB\b\.?/gi, 'Cabecera')
    .replace(/\bBONGO\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (titulo && detalle.toLowerCase().includes(titulo.toLowerCase())) {
    detalle = detalle
      .replace(new RegExp(`\\b${titulo}\\b`, 'gi'), '')
      .replace(/\s*•\s*•\s*/g, ' • ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  detalle = detalle.replace(/^•\s*/, '').replace(/\s*•$/, '').trim();

  if (!detalle || detalle.toLowerCase() === titulo.toLowerCase()) {
    if (/rural|vereda|corregimiento/i.test(titulo)) {
      detalle = 'Corregimiento • Rural';
    } else {
      detalle = 'Cabecera';
    }
  }

  return { titulo: titulo || raw, detalle: detalle || 'Cabecera' };
}

/**
 * Obtiene iniciales para el avatar del registrador
 */
const getInitials = (name: string) => {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return (parts[0]?.[0] || 'U').toUpperCase();
};

export const ElectorsDataTable: React.FC<ElectorsDataTableProps> = ({
  electors,
  loading = false,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
  onWhatsApp,
  isAdmin = true,
  emptyMessage = 'No se encontraron electores en este listado.',
  selectedIds: selectedIdsProp,
  onToggleSelectOne: onToggleSelectOneProp,
  onToggleSelectAll: onToggleSelectAllProp,
  onClearSelection: onClearSelectionProp,
  onBulkDelete,
  isDeletingBulk = false,
}) => {
  // Modo de vista en móviles: 'cards' (por defecto) o 'table'
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Estado interno si no se provee por props
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([]);
  const isControlled = selectedIdsProp !== undefined;
  const selectedIds = isControlled ? selectedIdsProp : localSelectedIds;

  const handleToggleSelectOne = (id: string) => {
    if (onToggleSelectOneProp) {
      onToggleSelectOneProp(id);
    } else {
      setLocalSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    }
  };

  const isAllSelected =
    electors.length > 0 && electors.every((e) => selectedIds.includes(e.id));
  const hasSomeSelected =
    !isAllSelected && electors.some((e) => selectedIds.includes(e.id));

  const handleToggleSelectAll = () => {
    if (onToggleSelectAllProp) {
      onToggleSelectAllProp();
    } else {
      if (isAllSelected) {
        setLocalSelectedIds([]);
      } else {
        setLocalSelectedIds(electors.map((e) => e.id));
      }
    }
  };

  const handleClearSelection = () => {
    if (onClearSelectionProp) {
      onClearSelectionProp();
    } else {
      setLocalSelectedIds([]);
    }
  };

  // Cálculo de paginación
  const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize)));
  const fromIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toIndex = Math.min(currentPage * pageSize, totalCount);

  // Disparador de WhatsApp
  const handleWhatsAppClick = (elector: ElectorWithRegistrant) => {
    if (onWhatsApp) {
      onWhatsApp(elector);
      return;
    }
    if (!elector.telefono) return;
    const cleanNumber = elector.telefono.replace(/\D/g, '');
    const phoneWithCountry = cleanNumber.length === 10 ? `57${cleanNumber}` : cleanNumber;
    const message = `Hola ${elector.nombres}, te confirmamos tu registro en el censo electoral. Tu puesto de votación asignado es: *${elector.puesto_votacion}*, *Mesa ${elector.mesa}*. ¡Contamos con tu respaldo! 🗳️`;
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="w-full bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.07] rounded-2xl overflow-hidden shadow-xs transition-colors duration-200">
      
      {/* Selector de Vista en Móviles */}
      <div className="flex md:hidden items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-[#18181b] border-b border-slate-200/80 dark:border-white/[0.06] text-xs">
        <div className="flex items-center gap-2">
          {isAdmin && electors.length > 0 && (
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={(input) => {
                if (input) input.indeterminate = hasSomeSelected;
              }}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded border-slate-300 dark:border-white/[0.14] text-blue-600 focus:ring-blue-500 bg-white dark:bg-[#121215] cursor-pointer"
              id="select-all-mobile"
            />
          )}
          <label htmlFor="select-all-mobile" className="text-[11px] font-mono tabular-nums text-slate-600 dark:text-zinc-400 font-medium uppercase tracking-wider cursor-pointer">
            {totalCount.toLocaleString()} electores
          </label>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.06] p-0.5 rounded-lg border border-slate-200/60 dark:border-white/[0.06]">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all ${
              viewMode === 'cards'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3 h-3" />
            <span>Tarjetas</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all ${
              viewMode === 'table'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <List className="w-3 h-3" />
            <span>Tabla</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          1. VISTA TARJETAS MÓVILES (Optimizado para Pantallas < md)
          ========================================================================= */}
      {viewMode === 'cards' && (
        <div className="md:hidden divide-y divide-slate-100 dark:divide-white/[0.04] bg-white dark:bg-[#121215]">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="p-4 space-y-3 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-24 bg-slate-100 dark:bg-white/[0.06] rounded" />
                  <div className="h-5 w-12 bg-slate-100 dark:bg-white/[0.06] rounded" />
                </div>
                <div className="h-5 w-44 bg-slate-100 dark:bg-white/[0.06] rounded" />
                <div className="h-4 w-32 bg-slate-100 dark:bg-white/[0.04] rounded" />
              </div>
            ))
          ) : electors.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-center text-slate-400 dark:text-zinc-500 mx-auto mb-3 shadow-xs">
                <Inbox className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                No se encontraron registros
              </h3>
              <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm mx-auto">
                {emptyMessage}
              </p>
            </div>
          ) : (
            electors.map((e) => {
              const { titulo, detalle } = formatearPuestoSimple(e.puesto_votacion);
              const registradorName =
                e.registrador?.full_name || (e as any).registrado_por_nombre || 'Sistema';
              const isTitular =
                e.registrador?.role === 'admin' ||
                (e as any).registrado_por_rol === 'admin' ||
                registradorName.toLowerCase().includes('candidato') ||
                registradorName.toLowerCase().includes('administrador') ||
                registradorName === 'Ober Osorio';

              return (
                <div
                  key={e.id}
                  className={`p-4 transition-colors space-y-3 ${
                    selectedIds.includes(e.id)
                      ? 'bg-blue-50/50 dark:bg-white/[0.04] border-l-2 border-l-blue-600'
                      : 'hover:bg-slate-50/60 dark:hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Fila 1: Checkbox + Documento + Edad + Mesa */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {isAdmin && (
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(e.id)}
                          onChange={() => handleToggleSelectOne(e.id)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-white/[0.14] text-blue-600 focus:ring-blue-500 bg-white dark:bg-[#121215] cursor-pointer shrink-0"
                          aria-label={`Seleccionar a ${e.nombres}`}
                        />
                      )}
                      <span className="font-mono tabular-nums font-semibold text-sm text-slate-900 dark:text-white tracking-tight">
                        {formatearCedula(e.cedula)}
                      </span>
                      {e.edad && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-white/[0.06] dark:text-zinc-300 dark:border-white/[0.08]">
                          {e.edad} años
                        </span>
                      )}
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-zinc-300 border border-slate-200/60 dark:border-white/[0.08] font-mono tabular-nums text-xs font-medium shrink-0">
                      Mesa {e.mesa}
                    </span>
                  </div>

                  {/* Fila 2: Nombre Completo */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-zinc-100 leading-snug break-words">
                      {e.nombres} {e.apellidos}
                    </h3>
                  </div>

                  {/* Fila 3: Puesto de Votación y Teléfono */}
                  <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-white/[0.04]">
                    <div className="flex items-start gap-2 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-slate-800 dark:text-zinc-200 block truncate" title={e.puesto_votacion}>
                          {titulo}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-zinc-500 block truncate">
                          {detalle || 'Cabecera'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                      {e.telefono ? (
                        <a
                          href={`tel:${e.telefono}`}
                          className="font-mono tabular-nums text-slate-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-white"
                        >
                          {e.telefono}
                        </a>
                      ) : (
                        <span className="text-slate-400 dark:text-zinc-600 italic text-[11px]">Sin teléfono</span>
                      )}
                    </div>
                  </div>

                  {/* Fila 4: Footer con Registrador, Fecha y Acciones */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/[0.04] text-xs">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-zinc-400 text-[11px]">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold ${
                          isTitular ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400' : 'bg-slate-100 text-slate-700 dark:bg-white/[0.06] dark:text-zinc-300'
                        }`}
                      >
                        {getInitials(registradorName)}
                      </div>
                      <span className="truncate max-w-[100px]" title={registradorName}>
                        {registradorName.split(' ')[0]}
                      </span>
                      <span>•</span>
                      <span className="font-mono tabular-nums text-[10px] text-slate-400 dark:text-zinc-500">
                        {formatearFechaUltraCorta(e.created_at)}
                      </span>
                    </div>

                    {/* Botones de Acción */}
                    <div className="flex items-center gap-1">
                      {e.telefono && (
                        <button
                          type="button"
                          onClick={() => handleWhatsAppClick(e)}
                          className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                          title="Enviar WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isAdmin && onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isAdmin && onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(e)}
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* =========================================================================
          2. VISTA TABLA COMPLETA CON SCROLL HORIZONTAL (Desktop o Modo Tabla Móvil)
          ========================================================================= */}
      <div className={`${viewMode === 'table' ? 'block' : 'hidden md:block'} overflow-x-auto scrollbar-thin w-full`}>
        <table className="w-full text-left border-collapse min-w-[960px]">
          {/* Cabecera de la Tabla */}
          <thead>
            <tr className="border-b border-slate-200/80 dark:border-white/[0.06] bg-slate-50/70 dark:bg-[#18181b]/50 text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              {isAdmin && (
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = hasSomeSelected;
                    }}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 dark:border-white/[0.14] text-blue-600 focus:ring-blue-500 bg-white dark:bg-[#121215] cursor-pointer transition-all"
                    aria-label="Seleccionar todos los electores visibles"
                  />
                </th>
              )}
              <th className="py-3 px-3 min-w-[130px]">Documento</th>
              <th className="py-3 px-3 min-w-[220px]">Nombre Completo</th>
              <th className="py-3 px-2 min-w-[110px]">Teléfono</th>
              <th className="py-3 px-3 min-w-[190px]">Puesto de Votación</th>
              <th className="py-3 px-1 min-w-[70px] text-center">Mesa</th>
              <th className="py-3 px-3 min-w-[140px]">Registrado Por</th>
              <th className="py-3 px-1 min-w-[70px] text-center">Fecha</th>
              <th className="py-3 pr-3 pl-1 min-w-[95px] text-right">Acciones</th>
            </tr>
          </thead>

          {/* Filas de Datos */}
          <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
            {loading ? (
              Array.from({ length: pageSize > 10 ? 8 : pageSize }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  {isAdmin && <td className="py-3 px-3 text-center"><div className="h-4 w-4 bg-slate-100 dark:bg-white/[0.06] rounded mx-auto" /></td>}
                  <td className="py-3 px-3"><div className="h-4 w-20 bg-slate-100 dark:bg-white/[0.06] rounded" /></td>
                  <td className="py-3 px-3"><div className="h-4 w-44 bg-slate-100 dark:bg-white/[0.06] rounded" /></td>
                  <td className="py-3 px-2"><div className="h-4 w-20 bg-slate-100 dark:bg-white/[0.06] rounded" /></td>
                  <td className="py-3 px-3">
                    <div className="h-4 w-32 bg-slate-100 dark:bg-white/[0.06] rounded mb-1" />
                    <div className="h-3 w-16 bg-slate-100 dark:bg-white/[0.04] rounded" />
                  </td>
                  <td className="py-3 px-1 text-center"><div className="h-5 w-8 bg-slate-100 dark:bg-white/[0.06] rounded mx-auto" /></td>
                  <td className="py-3 px-3"><div className="h-4 w-28 bg-slate-100 dark:bg-white/[0.06] rounded" /></td>
                  <td className="py-3 px-1 text-center"><div className="h-4 w-12 bg-slate-100 dark:bg-white/[0.06] rounded mx-auto" /></td>
                  <td className="py-3 pr-3 pl-1 text-right"><div className="h-5 w-16 bg-slate-100 dark:bg-white/[0.06] rounded ml-auto" /></td>
                </tr>
              ))
            ) : electors.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 9 : 8} className="py-20 px-4 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] flex items-center justify-center text-slate-400 dark:text-zinc-500 mb-3 shadow-xs">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                      No se encontraron registros
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 max-w-sm">
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              electors.map((e) => {
                const { titulo, detalle } = formatearPuestoSimple(e.puesto_votacion);
                const registradorName =
                  e.registrador?.full_name || (e as any).registrado_por_nombre || 'Sistema';
                const isTitular =
                  e.registrador?.role === 'admin' ||
                  (e as any).registrado_por_rol === 'admin' ||
                  registradorName.toLowerCase().includes('candidato') ||
                  registradorName.toLowerCase().includes('administrador') ||
                  registradorName === 'Ober Osorio';

                return (
                  <tr
                    key={e.id}
                    className={`transition-colors group ${
                      selectedIds.includes(e.id)
                        ? 'bg-blue-50/50 dark:bg-white/[0.04]'
                        : 'hover:bg-slate-50/60 dark:hover:bg-white/[0.02]'
                    }`}
                  >
                    {isAdmin && (
                      <td className="py-2.5 px-3 text-center" onClick={(ev) => ev.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(e.id)}
                          onChange={() => handleToggleSelectOne(e.id)}
                          className="w-4 h-4 rounded border-slate-300 dark:border-white/[0.14] text-blue-600 focus:ring-blue-500 bg-white dark:bg-[#121215] cursor-pointer transition-all"
                          aria-label={`Seleccionar a ${e.nombres}`}
                        />
                      </td>
                    )}
                    {/* DOCUMENTO */}
                    <td className="py-2.5 px-3 font-mono tabular-nums font-semibold text-xs text-slate-900 dark:text-white whitespace-nowrap">
                      {formatearCedula(e.cedula)}
                    </td>

                    {/* NOMBRE COMPLETO & EDAD */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="font-medium text-xs sm:text-sm text-slate-900 dark:text-zinc-100 truncate"
                          title={`${e.nombres} ${e.apellidos}`}
                        >
                          {e.nombres} {e.apellidos}
                        </span>
                        {e.edad && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums font-medium bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-white/[0.06] dark:text-zinc-300 dark:border-white/[0.08] whitespace-nowrap">
                            {e.edad}a
                          </span>
                        )}
                      </div>
                    </td>

                    {/* TELÉFONO */}
                    <td className="py-2.5 px-2 text-xs font-mono tabular-nums">
                      {e.telefono ? (
                        <span className="text-slate-700 dark:text-zinc-300 whitespace-nowrap block truncate" title={e.telefono}>
                          {e.telefono}
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-zinc-600 italic">Sin reg.</span>
                      )}
                    </td>

                    {/* PUESTO LIMPIO */}
                    <td className="py-2.5 px-3">
                      <span
                        className="font-medium text-xs text-slate-800 dark:text-zinc-200 block truncate"
                        title={titulo}
                      >
                        {titulo}
                      </span>
                      <span
                        className="text-[10px] text-slate-400 dark:text-zinc-500 block truncate"
                        title={detalle}
                      >
                        {detalle || 'Cabecera'}
                      </span>
                    </td>

                    {/* MESA */}
                    <td className="py-2.5 px-1 text-center">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.08] font-mono tabular-nums text-xs font-medium text-slate-700 dark:text-zinc-300">
                        M-{e.mesa}
                      </span>
                    </td>

                    {/* REGISTRADO POR */}
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-5 h-5 shrink-0 rounded-full bg-slate-100 dark:bg-white/[0.06] text-[10px] font-mono font-bold text-slate-700 dark:text-zinc-300 flex items-center justify-center border border-slate-200/60 dark:border-white/[0.08]">
                          {getInitials(registradorName)}
                        </span>
                        <span
                          className="text-xs text-slate-700 dark:text-zinc-300 truncate"
                          title={registradorName}
                        >
                          {registradorName}
                        </span>
                        {isTitular && (
                          <span className="shrink-0 px-1 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">
                            T
                          </span>
                        )}
                      </div>
                    </td>

                    {/* FECHA */}
                    <td className="py-2.5 px-1 text-center text-[11px] font-mono tabular-nums text-slate-400 dark:text-zinc-500 whitespace-nowrap">
                      {formatearFechaUltraCorta(e.created_at)}
                    </td>

                    {/* ACCIONES */}
                    <td className="py-2.5 pr-3 pl-1 text-right">
                      <div className="inline-flex items-center justify-end gap-1 w-full">
                        {e.telefono ? (
                          <button
                            type="button"
                            onClick={() => handleWhatsAppClick(e)}
                            className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-500/10 transition-colors cursor-pointer"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="w-5 h-5 inline-block" />
                        )}

                        {isAdmin && onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(e)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isAdmin && onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(e)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Barra Inferior de Paginación */}
      <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-[#18181b]/50 border-t border-slate-200/80 dark:border-white/[0.06] text-xs text-slate-500 dark:text-zinc-400 font-mono tabular-nums">
        <div>
          Mostrando <span className="font-semibold text-slate-700 dark:text-zinc-200">{fromIndex}</span> -{' '}
          <span className="font-semibold text-slate-700 dark:text-zinc-200">{toIndex}</span> de{' '}
          <span className="font-semibold text-slate-700 dark:text-zinc-200">{totalCount.toLocaleString()}</span> registros
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Anterior */}
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || loading}
            className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] text-slate-600 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer shadow-xs active:scale-[0.96]"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Pastilla Central */}
          <span className="px-3 py-1 rounded-lg bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.08] font-medium text-slate-700 dark:text-zinc-200 shadow-xs">
            Página <strong className="text-slate-900 dark:text-white font-semibold">{currentPage}</strong> de {totalPages}
          </span>

          {/* Botón Siguiente */}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages || loading}
            className="p-1.5 rounded-lg border border-slate-200/80 dark:border-white/[0.08] bg-white dark:bg-[#121215] text-slate-600 dark:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer shadow-xs active:scale-[0.96]"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Barra de Acción Masiva Flotante */}
      {isAdmin && selectedIds.length > 0 && (
        <div className="fixed bottom-4 sm:bottom-6 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-50 bg-white/95 dark:bg-[#18181b]/95 text-slate-900 dark:text-white px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-white/[0.1] backdrop-blur-xl flex items-center justify-between sm:justify-center gap-2 sm:gap-4 animate-in slide-in-from-bottom-4 duration-200 max-w-[calc(100vw-1.5rem)] sm:max-w-max mx-auto overflow-hidden">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
            <span className="min-w-6 h-6 px-1.5 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center font-mono tabular-nums shrink-0">
              {selectedIds.length}
            </span>
            <span className="text-xs font-medium text-slate-700 dark:text-zinc-200 hidden sm:inline whitespace-nowrap">
              {selectedIds.length === 1 ? 'elector seleccionado' : 'electores seleccionados'}
            </span>
            <span className="text-[11px] font-medium text-slate-700 dark:text-zinc-200 sm:hidden whitespace-nowrap">
              sel.
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-white/[0.1] shrink-0" />

          <button
            type="button"
            onClick={handleClearSelection}
            className="text-[11px] sm:text-xs font-medium text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0 whitespace-nowrap px-1"
          >
            Deseleccionar
          </button>

          <button
            type="button"
            disabled={isDeletingBulk}
            onClick={onBulkDelete}
            className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-[11px] sm:text-xs font-semibold text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span className="sm:hidden">
              {isDeletingBulk ? 'Eliminando...' : `Eliminar (${selectedIds.length})`}
            </span>
            <span className="hidden sm:inline">
              {isDeletingBulk ? 'Eliminando...' : `Eliminar seleccionados (${selectedIds.length})`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
