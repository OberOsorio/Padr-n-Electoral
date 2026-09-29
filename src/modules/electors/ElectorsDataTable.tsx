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
 * Formatea fechas a formato ultra compacto (ej: '28 sep' o '28/09')
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
 * Limpia y normaliza el nombre del puesto de votación eliminando sufijos crudos
 * como "CGTO ... M.D. CL P/PAL" o "(BONGO)" y separando el título del detalle territorial
 */
function formatearPuestoSimple(puesto?: string | null): { titulo: string; detalle: string } {
  if (!puesto) {
    return { titulo: 'Sin puesto asignado', detalle: 'Cabecera' };
  }

  let raw = puesto.trim();
  let titulo = raw;
  let detalle = '';

  // 1. Separar si contiene guión o barra explícita: "TITULO - DETALLE"
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

  // 2. Limpiar cadenas crudas del título
  titulo = titulo
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\bBONGO\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  // 3. Limpiar detalle territorial y reemplazar acrónimos crudos de registraduría
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
}) => {
  // Modo de vista en móviles: 'cards' (por defecto) o 'table'
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Cálculo de paginación
  const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize)));
  const fromIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toIndex = Math.min(currentPage * pageSize, totalCount);

  // Disparador de WhatsApp con mensaje oficial
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
    <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
      
      {/* Selector de Vista en Móviles */}
      <div className="flex md:hidden items-center justify-between px-3.5 py-2.5 bg-slate-950/60 border-b border-slate-800/80 text-xs">
        <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase tracking-wider">
          {totalCount.toLocaleString()} electores
        </span>
        <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all ${
              viewMode === 'cards'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
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
                : 'text-slate-400 hover:text-white'
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
        <div className="md:hidden divide-y divide-slate-800/40">
          {loading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="p-4 space-y-3 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="h-5 w-24 bg-slate-800 rounded" />
                  <div className="h-5 w-12 bg-slate-800 rounded" />
                </div>
                <div className="h-5 w-44 bg-slate-800 rounded" />
                <div className="h-4 w-32 bg-slate-800/60 rounded" />
              </div>
            ))
          ) : electors.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Inbox className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white">No se encontraron registros</p>
              <p className="text-xs text-slate-400 mt-1">{emptyMessage}</p>
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
                  className="p-4 hover:bg-slate-800/20 transition-colors space-y-3"
                >
                  {/* Fila 1: Documento + Edad + Mesa */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sm text-white tracking-tight">
                        {formatearCedula(e.cedula)}
                      </span>
                      {e.edad && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                          {e.edad} años
                        </span>
                      )}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 font-mono text-xs font-bold shrink-0">
                      Mesa {e.mesa}
                    </span>
                  </div>

                  {/* Fila 2: Nombre Completo (Legible y sin cortes accidentales) */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100 leading-snug break-words">
                      {e.nombres} {e.apellidos}
                    </h3>
                  </div>

                  {/* Fila 3: Puesto de Votación y Teléfono */}
                  <div className="grid grid-cols-1 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800/40">
                    <div className="flex items-start gap-2 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-slate-200 block truncate" title={e.puesto_votacion}>
                          {titulo}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {detalle || 'Cabecera'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {e.telefono ? (
                        <a
                          href={`tel:${e.telefono}`}
                          className="font-mono text-slate-300 hover:text-white"
                        >
                          {e.telefono}
                        </a>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Sin teléfono registrado</span>
                      )}
                    </div>
                  </div>

                  {/* Fila 4: Footer con Registrador, Fecha y Acciones */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/60 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                          isTitular ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {getInitials(registradorName)}
                      </div>
                      <span className="truncate max-w-[100px]" title={registradorName}>
                        {registradorName.split(' ')[0]}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {formatearFechaUltraCorta(e.created_at)}
                      </span>
                    </div>

                    {/* Botones de Acción Táctiles */}
                    <div className="flex items-center gap-1.5">
                      {e.telefono && (
                        <button
                          type="button"
                          onClick={() => handleWhatsAppClick(e)}
                          className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
                          title="Enviar WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}

                      {isAdmin && onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(e)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}

                      {isAdmin && onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(e)}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
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
      <div className={`${viewMode === 'table' ? 'block' : 'hidden md:block'} overflow-x-auto scrollbar-thin scrollbar-thumb-slate-700 w-full`}>
        <table className="w-full text-left border-collapse min-w-[960px]">
          {/* Cabecera de la Tabla con anchos mínimos garantizados para evitar solapamiento */}
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-950/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-3 min-w-[130px]">Documento</th>
              <th className="py-3.5 px-3 min-w-[220px]">Nombre Completo</th>
              <th className="py-3.5 px-2 min-w-[110px]">Teléfono</th>
              <th className="py-3.5 px-3 min-w-[190px]">Puesto de Votación</th>
              <th className="py-3.5 px-1 min-w-[70px] text-center">Mesa</th>
              <th className="py-3.5 px-3 min-w-[140px]">Registrado Por</th>
              <th className="py-3.5 px-1 min-w-[70px] text-center">Fecha</th>
              <th className="py-3.5 pr-3 pl-1 min-w-[95px] text-right">Acciones</th>
            </tr>
          </thead>

          {/* Filas de Datos */}
          <tbody className="divide-y divide-slate-800/40">
            {loading ? (
              Array.from({ length: pageSize > 10 ? 8 : pageSize }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-3 px-3"><div className="h-4 w-20 bg-slate-800 rounded" /></td>
                  <td className="py-3 px-3"><div className="h-4 w-44 bg-slate-800 rounded" /></td>
                  <td className="py-3 px-2"><div className="h-4 w-20 bg-slate-800 rounded" /></td>
                  <td className="py-3 px-3">
                    <div className="h-4 w-32 bg-slate-800 rounded mb-1" />
                    <div className="h-3 w-16 bg-slate-800/60 rounded" />
                  </td>
                  <td className="py-3 px-1 text-center"><div className="h-5 w-8 bg-slate-800 rounded mx-auto" /></td>
                  <td className="py-3 px-3"><div className="h-4 w-28 bg-slate-800 rounded" /></td>
                  <td className="py-3 px-1 text-center"><div className="h-4 w-12 bg-slate-800 rounded mx-auto" /></td>
                  <td className="py-3 pr-3 pl-1 text-right"><div className="h-5 w-16 bg-slate-800 rounded ml-auto" /></td>
                </tr>
              ))
            ) : electors.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 px-4 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-11 w-11 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-white">No se encontraron registros</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">{emptyMessage}</p>
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
                    className="hover:bg-slate-800/25 transition-colors group"
                  >
                    {/* DOCUMENTO */}
                    <td className="py-3 px-3 font-mono font-bold text-xs text-slate-100 whitespace-nowrap">
                      {formatearCedula(e.cedula)}
                    </td>

                    {/* NOMBRE COMPLETO & EDAD */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="font-semibold text-xs sm:text-sm text-slate-100 truncate"
                          title={`${e.nombres} ${e.apellidos}`}
                        >
                          {e.nombres} {e.apellidos}
                        </span>
                        {e.edad && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20 whitespace-nowrap">
                            {e.edad}a
                          </span>
                        )}
                      </div>
                    </td>

                    {/* TELÉFONO */}
                    <td className="py-3 px-2 text-xs font-mono">
                      {e.telefono ? (
                        <span className="text-slate-300 whitespace-nowrap block truncate" title={e.telefono}>
                          {e.telefono}
                        </span>
                      ) : (
                        <span className="text-slate-600 italic">Sin reg.</span>
                      )}
                    </td>

                    {/* PUESTO LIMPIO */}
                    <td className="py-3 px-3">
                      <span
                        className="font-medium text-xs sm:text-sm text-slate-200 block truncate"
                        title={titulo}
                      >
                        {titulo}
                      </span>
                      <span
                        className="text-[10px] text-slate-500 block truncate"
                        title={detalle}
                      >
                        {detalle || 'Cabecera'}
                      </span>
                    </td>

                    {/* MESA */}
                    <td className="py-3 px-1 text-center">
                      <span className="inline-block px-1.5 py-0.5 rounded bg-slate-800/90 border border-slate-700/60 font-mono text-xs font-bold text-slate-200">
                        M-{e.mesa}
                      </span>
                    </td>

                    {/* REGISTRADO POR */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-5 h-5 shrink-0 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 flex items-center justify-center border border-slate-700">
                          {getInitials(registradorName)}
                        </span>
                        <span
                          className="text-xs text-slate-300 truncate"
                          title={registradorName}
                        >
                          {registradorName}
                        </span>
                        {isTitular && (
                          <span className="shrink-0 px-1 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            T
                          </span>
                        )}
                      </div>
                    </td>

                    {/* FECHA */}
                    <td className="py-3 px-1 text-center text-[11px] font-mono text-slate-400 whitespace-nowrap">
                      {formatearFechaUltraCorta(e.created_at)}
                    </td>

                    {/* ACCIONES */}
                    <td className="py-3 pr-3 pl-1 text-right">
                      <div className="inline-flex items-center justify-end gap-1 w-full">
                        {e.telefono ? (
                          <button
                            type="button"
                            onClick={() => handleWhatsAppClick(e)}
                            className="p-1 rounded text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer"
                            title="WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="w-5.5 h-5.5 inline-block" />
                        )}

                        {isAdmin && onEdit && (
                          <button
                            type="button"
                            onClick={() => onEdit(e)}
                            className="p-1 rounded text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isAdmin && onDelete && (
                          <button
                            type="button"
                            onClick={() => onDelete(e)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
      <div className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400 font-mono transition-colors">
        <div>
          Mostrando <span className="font-semibold text-slate-200">{fromIndex}</span> -{' '}
          <span className="font-semibold text-slate-200">{toIndex}</span> de{' '}
          <span className="font-semibold text-slate-200">{totalCount.toLocaleString()}</span> registros
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Anterior */}
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || loading}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Pastilla Central */}
          <span className="px-3 py-1 rounded-lg bg-slate-800/90 border border-slate-700/60 text-slate-300 shadow-xs font-medium">
            Página <strong className="text-white">{currentPage}</strong> de {totalPages}
          </span>

          {/* Botón Siguiente */}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages || loading}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
