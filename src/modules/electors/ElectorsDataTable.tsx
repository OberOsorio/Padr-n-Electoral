import React from 'react';
import {
  Phone,
  MessageSquare,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Inbox,
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
  // Cálculo de paginación
  const totalPages = Math.max(1, Math.ceil(totalCount / Math.max(1, pageSize)));
  const fromIndex = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toIndex = Math.min(currentPage * pageSize, totalCount);

  // Formato compacto y sobrio en español (ej. "24 sept 2026")
  const formatDateCompact = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      const months = [
        'ene', 'feb', 'mar', 'abr', 'may', 'jun',
        'jul', 'ago', 'sept', 'oct', 'nov', 'dic',
      ];
      const day = d.getDate();
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch {
      return '—';
    }
  };

  // Disparador de WhatsApp predeterminado con mensaje oficial
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
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0F172A]/70 backdrop-blur-md overflow-hidden shadow-xs dark:shadow-xl transition-colors">
      {/* Contenedor Adaptable sin Barra de Desplazamiento Forzada */}
      <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <table className="w-full text-left border-collapse table-auto">
          {/* Cabecera de la Tabla */}
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800/80">
              <th scope="col" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase px-3 py-3 text-left whitespace-nowrap">
                Documento
              </th>
              <th scope="col" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase px-3 py-3 text-left whitespace-nowrap">
                Nombre Completo
              </th>
              <th scope="col" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase px-3 py-3 text-left whitespace-nowrap">
                Teléfono
              </th>
              <th scope="col" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase px-3 py-3 text-left whitespace-nowrap">
                Puesto de Votación
              </th>
              <th scope="col" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase px-2 py-3 text-center whitespace-nowrap">
                Mesa
              </th>
              <th scope="col" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase px-3 py-3 text-left whitespace-nowrap">
                Registrado Por
              </th>
              <th scope="col" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase px-3 py-3 text-left whitespace-nowrap">
                Fecha
              </th>
              <th scope="col" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wider uppercase px-3 py-3 text-right whitespace-nowrap">
                Acciones
              </th>
            </tr>
          </thead>

          {/* Filas de Datos */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {loading ? (
              // Esqueletos de carga
              Array.from({ length: pageSize > 10 ? 8 : pageSize }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-3 py-3"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="px-3 py-3">
                    <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded mb-1" />
                    <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800/60 rounded" />
                  </td>
                  <td className="px-3 py-3"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="px-3 py-3"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="px-2 py-3 text-center"><div className="h-5 w-10 bg-slate-200 dark:bg-slate-800 rounded mx-auto" /></td>
                  <td className="px-3 py-3"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="px-3 py-3"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded" /></td>
                  <td className="px-3 py-3 text-right"><div className="h-7 w-20 bg-slate-200 dark:bg-slate-800 rounded ml-auto" /></td>
                </tr>
              ))
            ) : electors.length === 0 ? (
              // Estado vacío
              <tr>
                <td colSpan={8} className="py-14 px-4 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">
                      No se encontraron registros
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              electors.map((elector) => {
                const fullName = `${elector.nombres} ${elector.apellidos}`;
                const registradorName =
                  elector.registrador?.full_name || 'Personal Autorizado';

                return (
                  <tr
                    key={elector.id}
                    className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* DOCUMENTO */}
                    <td className="font-mono text-xs font-semibold text-slate-900 dark:text-white px-3 py-3 whitespace-nowrap">
                      {elector.cedula}
                    </td>

                    {/* NOMBRE COMPLETO + EDAD + NOTA */}
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white tracking-tight block truncate max-w-[160px] sm:max-w-[200px] lg:max-w-none"
                          title={fullName}
                        >
                          {fullName}
                        </span>
                        {elector.edad && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                            {elector.edad} años
                          </span>
                        )}
                      </div>
                      {elector.notas && (
                        <span
                          className="text-[11px] text-slate-500 dark:text-slate-400 font-normal italic truncate max-w-[160px] sm:max-w-[200px] lg:max-w-none block mt-0.5"
                          title={elector.notas}
                        >
                          {elector.notas}
                        </span>
                      )}
                    </td>

                    {/* TELÉFONO */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {elector.telefono ? (
                        <div className="font-mono text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Phone className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span>{elector.telefono}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* PUESTO DE VOTACIÓN */}
                    <td className="text-xs text-slate-700 dark:text-slate-300 font-normal px-3 py-3">
                      <span
                        className="truncate max-w-[140px] sm:max-w-[180px] lg:max-w-none block"
                        title={elector.puesto_votacion}
                      >
                        {elector.puesto_votacion}
                      </span>
                    </td>

                    {/* MESA */}
                    <td className="px-2 py-3 text-center whitespace-nowrap">
                      <span className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 px-2 py-0.5 rounded text-[11px] font-mono font-medium inline-block text-center shadow-2xs">
                        M-{elector.mesa}
                      </span>
                    </td>

                    {/* REGISTRADO POR */}
                    <td className="text-xs text-slate-600 dark:text-slate-400 px-3 py-3 font-medium">
                      <span
                        className="truncate max-w-[110px] sm:max-w-[140px] lg:max-w-none block"
                        title={registradorName}
                      >
                        {registradorName}
                      </span>
                    </td>

                    {/* FECHA */}
                    <td
                      className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono px-3 py-3"
                      title={elector.created_at ? new Date(elector.created_at).toLocaleString('es-CO') : ''}
                    >
                      {formatDateCompact(elector.created_at)}
                    </td>

                    {/* ACCIONES */}
                    <td className="px-3 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Botón WhatsApp */}
                        {elector.telefono ? (
                          <button
                            type="button"
                            onClick={() => handleWhatsAppClick(elector)}
                            className="h-7.5 w-7.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center transition-colors cursor-pointer active:scale-95 shadow-2xs"
                            title={`Enviar mensaje de confirmación a ${elector.nombres}`}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>
                        ) : (
                          <span
                            className="h-7.5 w-7.5 rounded-lg bg-slate-100 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border border-slate-200 dark:border-slate-800/60 flex items-center justify-center cursor-not-allowed opacity-40"
                            title="Sin teléfono registrado"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </span>
                        )}

                        {/* Botón Editar */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => onEdit?.(elector)}
                            className="h-7.5 w-7.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:border-slate-300 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center transition-colors cursor-pointer active:scale-95 shadow-2xs"
                            title="Editar elector"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Botón Eliminar */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => onDelete?.(elector)}
                            className="h-7.5 w-7.5 rounded-lg bg-slate-100 hover:bg-red-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:bg-red-500/10 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center transition-colors cursor-pointer active:scale-95 shadow-2xs"
                            title="Eliminar elector"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* 4. Barra Inferior de Paginación */}
      <div className="px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40 text-xs text-slate-500 dark:text-slate-400 font-mono transition-colors">
        <div>
          Mostrando <span className="font-semibold text-slate-900 dark:text-white">{fromIndex}</span> -{' '}
          <span className="font-semibold text-slate-900 dark:text-white">{toIndex}</span> de{' '}
          <span className="font-semibold text-slate-900 dark:text-white">{totalCount.toLocaleString()}</span> registros
        </div>

        <div className="flex items-center gap-2">
          {/* Botón Anterior */}
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1 || loading}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
            title="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Pastilla Central */}
          <span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 shadow-2xs font-medium">
            Página <strong className="text-slate-900 dark:text-white">{currentPage}</strong> de {totalPages}
          </span>

          {/* Botón Siguiente */}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages || loading}
            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
            title="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
