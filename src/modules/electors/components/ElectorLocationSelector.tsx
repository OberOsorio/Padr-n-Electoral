import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, Layers, Check, Search, ChevronDown, Building2 } from 'lucide-react';
import type { PollingPlace } from '../../../types';
import { normalizarTexto } from '../../../services/divipoleService';

export interface PuestoFormateado {
  titulo: string;
  detalle: string;
  label: string;
}

/**
 * Función oficial de formateo de puestos de votación
 */
export function formatearPuestoSimple(rawNombre: string, fallbackZone: string = ''): PuestoFormateado {
  if (!rawNombre) {
    return { titulo: '', detalle: fallbackZone || '', label: '' };
  }

  let txt = rawNombre.trim();
  txt = txt.replace(/^\([^)]+\)\s*/i, '');

  const esRural =
    /zona rural|rural|cgto|corregimiento|vereda/i.test(txt) ||
    (fallbackZone && /rural/i.test(fallbackZone));

  if (/ie\s+de\s+bto\s+el\s+carmen|cabecera.*el\s+carmen/i.test(txt)) {
    return {
      titulo: 'I.E. El Carmen',
      detalle: 'Cabecera Municipal',
      label: 'I.E. El Carmen (Cabecera Municipal)',
    };
  }

  if (/^puesto\s+cabecera\s+municipal/i.test(txt)) {
    const sinCabecera = txt.replace(/^puesto\s+cabecera\s+municipal\s*/i, '');
    if (sinCabecera.length > 2) {
      txt = sinCabecera;
    }
  }

  let nombreBase = '';

  const instMatch = txt.match(
    /^((?:i\.?e\.?|col(?:egio|\.)?|escuela|instituci[oó]n|sede|universidad|polideportivo|salon|casa|parque)\s+[^,\-\(\)\#]+?)(?=\s+(?:cgto|cll|cl\s|cra|cr|calle|carrera|diag|av|barrio|b\/|fte|no\.|#|\(|$))/i
  );

  if (instMatch && instMatch[1].trim().length > 4) {
    nombreBase = instMatch[1].trim();
  } else {
    const matchCorregimiento = txt.match(
      /^([a-záéíóúñ\s\.\-]+?)(?=\s+(?:cgto|ie\s+sede|ie|cll|cl\s|cra|cr|calle|carrera|barrio|b\/|p\/pal|\(|$))/i
    );
    if (matchCorregimiento && matchCorregimiento[1].trim().length > 2) {
      nombreBase = matchCorregimiento[1].trim();
    } else {
      nombreBase = txt.replace(/\s+(?:cll|cl\s|cra|cr|calle|carrera|barrio|b\/|p\/pal|\().*$/i, '').trim();
    }
  }

  if (!nombreBase) {
    nombreBase = txt;
  }

  nombreBase = nombreBase.replace(/[\s\.\,\-]+$/, '').trim();

  const words = nombreBase.split(' ');
  nombreBase = words
    .map((w, idx) => {
      const lower = w.toLowerCase();
      const prevLower = idx > 0 ? words[idx - 1].toLowerCase() : '';
      const shouldCapitalizeArticle =
        idx === 0 || ['ie', 'i.e', 'i.e.', 'col', 'col.', 'sede', 'escuela'].includes(prevLower);
      if (!shouldCapitalizeArticle && ['de', 'del', 'las', 'los', 'el', 'la', 'y', 'en'].includes(lower)) {
        return lower;
      }
      if (['ie', 'i.e', 'i.e.'].includes(lower)) return 'I.E.';
      if (['col', 'col.'].includes(lower)) return 'Col.';
      if (/^(?:x{0,3})(?:ix|iv|v?i{0,3})$/i.test(lower) && lower.length >= 2) return lower.toUpperCase();
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(' ');

  if (nombreBase.length > 0) {
    nombreBase = nombreBase.charAt(0).toUpperCase() + nombreBase.slice(1);
  }

  let subDetalle = esRural ? 'Corregimiento • Rural' : 'Cabecera Municipal';
  if (/vereda/i.test(txt)) subDetalle = 'Vereda • Rural';

  return {
    titulo: nombreBase || rawNombre,
    detalle: subDetalle,
    label: `${nombreBase || rawNombre} (${subDetalle})`,
  };
}

export interface ElectorLocationSelectorProps {
  puestoVotacion: string;
  onPuestoChange: (puesto: string) => void;
  mesa: number | '';
  onMesaChange: (mesa: number | '') => void;
  pollingPlaces: PollingPlace[];
  municipio?: string;
  onMunicipioChange?: (muni: string) => void;
  departamento?: string;
  availableMunicipios?: string[];
  disabled?: boolean;
  mesaInputRef?: React.RefObject<HTMLSelectElement | null>;
  rememberLocation?: boolean;
  onRememberLocationChange?: (val: boolean) => void;
  showSectionWrapper?: boolean;
  showRememberCheckbox?: boolean;
  className?: string;
}

export const ElectorLocationSelector: React.FC<ElectorLocationSelectorProps> = ({
  puestoVotacion,
  onPuestoChange,
  mesa,
  onMesaChange,
  pollingPlaces = [],
  municipio,
  onMunicipioChange,
  departamento = 'Córdoba',
  availableMunicipios,
  disabled = false,
  mesaInputRef,
  rememberLocation = false,
  onRememberLocationChange,
  showSectionWrapper = true,
  showRememberCheckbox = true,
  className = '',
}) => {
  const [isOpenCombobox, setIsOpenCombobox] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cierre al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!isOpenCombobox) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpenCombobox(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpenCombobox(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpenCombobox]);

  useEffect(() => {
    if (isOpenCombobox) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpenCombobox]);

  const currentPollingPlace = useMemo(() => {
    if (!puestoVotacion) return null;
    const target = normalizarTexto(puestoVotacion);
    return (
      pollingPlaces.find((p) => {
        const pName = normalizarTexto(p.name);
        return pName === target || pName.includes(target) || target.includes(pName);
      }) || null
    );
  }, [pollingPlaces, puestoVotacion]);

  const currentFormatted = useMemo(() => {
    if (!currentPollingPlace) return null;
    return formatearPuestoSimple(currentPollingPlace.name, currentPollingPlace.zone);
  }, [currentPollingPlace]);

  const totalMesas = currentPollingPlace?.totalMesas || (currentPollingPlace as any)?.total_mesas || 0;

  const formattedPlaces = useMemo(() => {
    return pollingPlaces.map((p) => {
      const fmt = formatearPuestoSimple(p.name, p.zone);
      return {
        ...p,
        fmtTitulo: fmt.titulo,
        fmtDetalle: fmt.detalle,
        fmtLabel: fmt.label,
      };
    });
  }, [pollingPlaces]);

  const filteredPlaces = useMemo(() => {
    if (!searchTerm.trim()) return formattedPlaces;
    const term = searchTerm
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    return formattedPlaces.filter((p) => {
      const matchTitulo = p.fmtTitulo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(term);
      const matchDetalle = p.fmtDetalle.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(term);
      const matchRaw = p.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(term);
      return matchTitulo || matchDetalle || matchRaw;
    });
  }, [formattedPlaces, searchTerm]);

  const hasMultipleMunicipios = Boolean(onMunicipioChange && availableMunicipios && availableMunicipios.length > 1);

  const content = (
    <div className="space-y-3.5">
      {/* Encabezado con estado y detalle de mesas */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-zinc-300 font-medium flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
            Ubicación Electoral
          </span>
          {municipio && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-blue-50 dark:bg-white/[0.06] text-blue-700 dark:text-zinc-300 border border-blue-200/60 dark:border-white/[0.08]">
              Circunscripción: {municipio} · {departamento} (<span className="tabular-nums">{pollingPlaces.length}</span> puestos)
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono tabular-nums text-slate-500 dark:text-zinc-400">
          {currentFormatted
            ? `${currentFormatted.detalle} · ${totalMesas} ${totalMesas === 1 ? 'Mesa' : 'Mesas'}`
            : 'Seleccione un puesto para ver mesas'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* Selector de Municipio */}
        {hasMultipleMunicipios && (
          <div className="col-span-1 sm:col-span-4 space-y-1.5">
            <label
              htmlFor="municipio-selector"
              className="block text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-zinc-300 truncate"
            >
              Municipio / Jurisdicción
            </label>
            <div className="relative">
              <select
                id="municipio-selector"
                value={municipio || ''}
                onChange={(e) => {
                  if (onMunicipioChange) {
                    onMunicipioChange(e.target.value);
                  }
                }}
                disabled={disabled}
                className="w-full h-10 pl-3.5 pr-8 bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs font-medium text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 appearance-none cursor-pointer"
              >
                {availableMunicipios!.map((m) => (
                  <option key={m} value={m} className="bg-white dark:bg-[#18181b] text-slate-900 dark:text-zinc-100">
                    {m} ({departamento})
                  </option>
                ))}
              </select>
              <Building2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Selector Desplegable de Puesto de Votación */}
        <div className={`col-span-1 ${hasMultipleMunicipios ? 'sm:col-span-5' : 'sm:col-span-8'} space-y-1.5`} ref={dropdownRef}>
          <label
            htmlFor="puesto-trigger"
            className="block text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-zinc-300 truncate"
          >
            Puesto de Votación
          </label>

          <div className="relative">
            <button
              type="button"
              id="puesto-trigger"
              disabled={disabled}
              onClick={() => setIsOpenCombobox((prev) => !prev)}
              className="w-full min-h-[40px] px-3.5 py-2 bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-left flex items-center justify-between gap-2 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 cursor-pointer shadow-xs active:scale-[0.99]"
            >
              {currentFormatted ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-zinc-100 truncate">
                    {currentFormatted.titulo}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-zinc-400 border border-slate-200/60 dark:border-white/[0.06] w-fit">
                    {currentFormatted.detalle}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400 dark:text-zinc-500">
                  Seleccione puesto de votación...
                </span>
              )}
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-zinc-500 shrink-0">
                <MapPin className="w-3.5 h-3.5" />
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpenCombobox ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Menú Desplegable con Búsqueda */}
            {isOpenCombobox && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white dark:bg-[#18181b] border border-slate-200/90 dark:border-white/[0.1] rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
                <div className="p-2 border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#121215]">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar puesto..."
                      className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.08] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-slate-100/50 dark:divide-white/[0.04]">
                  {filteredPlaces.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400 dark:text-zinc-500">
                      No se encontraron puestos
                    </div>
                  ) : (
                    filteredPlaces.map((p) => {
                      const isSelected = p.name === puestoVotacion;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            onPuestoChange(p.name);
                            onMesaChange('');
                            setIsOpenCombobox(false);
                          }}
                          className={`w-full px-2.5 py-2 rounded-lg text-left flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50/80 dark:bg-white/[0.08] text-blue-700 dark:text-white font-medium'
                              : 'hover:bg-slate-50 dark:hover:bg-white/[0.03] text-slate-700 dark:text-zinc-300'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-xs font-semibold text-slate-900 dark:text-zinc-100 truncate">
                              {p.fmtTitulo}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                              {p.fmtDetalle} · <span className="font-mono tabular-nums">{p.totalMesas}</span> {p.totalMesas === 1 ? 'Mesa' : 'Mesas'}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-blue-600 dark:text-white shrink-0" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selector de Mesa Dinámico */}
        <div className={`col-span-1 ${hasMultipleMunicipios ? 'sm:col-span-3' : 'sm:col-span-4'} space-y-1.5`}>
          <label
            htmlFor="mesa"
            className="block text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-zinc-300 whitespace-nowrap"
          >
            Número de Mesa
          </label>
          <div className="relative">
            <select
              ref={mesaInputRef}
              id="mesa"
              value={mesa || ''}
              onChange={(e) => onMesaChange(e.target.value ? Number(e.target.value) : '')}
              disabled={disabled || !puestoVotacion}
              className="w-full h-10 pl-3.5 pr-9 bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.08] rounded-xl text-xs font-mono tabular-nums text-slate-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 appearance-none cursor-pointer truncate"
            >
              <option value="" disabled className="bg-white dark:bg-[#18181b] text-slate-400 dark:text-zinc-500 font-sans">
                {puestoVotacion ? 'Mesa...' : 'Puesto primero...'}
              </option>
              {Array.from({ length: Math.max(1, totalMesas) }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m} className="bg-white dark:bg-[#18181b] text-slate-900 dark:text-zinc-100 font-mono">
                  Mesa {m}
                </option>
              ))}
            </select>
            <Layers className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Opción de recordar puesto y mesa (Modo digitación en lote) */}
      {showRememberCheckbox && onRememberLocationChange && (
        <div className="pt-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="remember-location-toggle"
            checked={rememberLocation}
            onChange={(e) => onRememberLocationChange(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-slate-300 dark:border-white/[0.14] text-blue-600 focus:ring-blue-500 bg-white dark:bg-[#18181b] cursor-pointer"
          />
          <label htmlFor="remember-location-toggle" className="text-xs text-slate-600 dark:text-zinc-400 cursor-pointer select-none">
            Recordar puesto y mesa para los siguientes registros (Modo Lote)
          </label>
        </div>
      )}
    </div>
  );

  if (!showSectionWrapper) {
    return <div className={className}>{content}</div>;
  }

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-xl bg-slate-50/70 dark:bg-[#18181b]/50 border border-slate-200/80 dark:border-white/[0.06] transition-colors ${className}`}
    >
      {content}
    </div>
  );
};
