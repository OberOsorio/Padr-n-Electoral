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
 * Función oficial de formateo de puestos de votación:
 * Limpia prefijos técnicos como (BONGO), (COTORRA), direcciones repetitivas y 'PUESTO CABECERA MUNICIPAL'
 * para presentar un título claro y conciso con su categoría (Cabecera / Corregimiento / Comuna).
 */
export function formatearPuestoSimple(rawNombre: string, fallbackZone: string = ''): PuestoFormateado {
  if (!rawNombre) {
    return { titulo: '', detalle: fallbackZone || '', label: '' };
  }

  let txt = rawNombre.trim();

  // 1. Quitar cualquier prefijo entre paréntesis inicial: "(BONGO)", "(COTORRA)", "(AYAPEL)", etc.
  txt = txt.replace(/^\([^)]+\)\s*/i, '');

  // 2. Extraer si es Cabecera o Zona Rural
  const esCabecera = /cabecera/i.test(txt) || (fallbackZone && /cabecera/i.test(fallbackZone));
  const esRural =
    /zona rural|rural|cgto|corregimiento|vereda/i.test(txt) ||
    (fallbackZone && /rural/i.test(fallbackZone));

  // 3. Manejar caso especial Cabecera Municipal / Colegio principal (ej. Cotorra / El Carmen)
  if (/ie\s+de\s+bto\s+el\s+carmen|cabecera.*el\s+carmen/i.test(txt)) {
    return {
      titulo: 'I.E. El Carmen',
      detalle: 'Cabecera Municipal',
      label: 'I.E. El Carmen (Cabecera Municipal)',
    };
  }

  // 4. Limpiar prefijo "PUESTO CABECERA MUNICIPAL" si existe
  if (/^puesto\s+cabecera\s+municipal/i.test(txt)) {
    const sinCabecera = txt.replace(/^puesto\s+cabecera\s+municipal\s*/i, '');
    if (sinCabecera.length > 2) {
      txt = sinCabecera;
    }
  }

  let nombreBase = '';

  // 5. Si empieza por Institución Educativa o entidad (I.E., COL., ESCUELA, UNIVERSIDAD, etc.)
  const instMatch = txt.match(
    /^((?:i\.?e\.?|col(?:egio|\.)?|escuela|instituci[oó]n|sede|universidad|polideportivo|salon|casa|parque)\s+[^,\-\(\)\#]+?)(?=\s+(?:cgto|cll|cl\s|cra|cr|calle|carrera|diag|av|barrio|b\/|fte|no\.|#|\(|$))/i
  );

  if (instMatch && instMatch[1].trim().length > 4) {
    nombreBase = instMatch[1].trim();
  } else {
    // 6. Si contiene Corregimiento o Vereda seguido de CGTO, CL, etc.
    // Ej: "LOS GOMEZ CGTO...", "MORALITO CGTO...", "ABROJAL IE SEDE...", "EL PASO DE LAS FLORES CL..."
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

  // Capitalización adecuada respetando siglas comunes
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

  let subDetalle = esRural
    ? 'Corregimiento • Rural'
    : (esCabecera ? 'Cabecera' : (fallbackZone || 'Puesto de Votación'));

  if (/abrojal/i.test(nombreBase)) subDetalle = 'I.E. Sede Abrojal • Rural';

  return {
    titulo: nombreBase,
    detalle: subDetalle,
    label: `${nombreBase} (${subDetalle})`,
  };
}

export interface ElectorLocationSelectorProps {
  puestoVotacion: string;
  onPuestoChange: (newPuesto: string) => void;
  mesa: number | '';
  onMesaChange: (newMesa: number | '') => void;
  pollingPlaces: PollingPlace[];
  municipio?: string;
  onMunicipioChange?: (newMunicipio: string) => void;
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
  pollingPlaces,
  municipio,
  onMunicipioChange,
  departamento = 'Córdoba',
  availableMunicipios,
  disabled = false,
  mesaInputRef,
  rememberLocation: _rememberLocation = false,
  onRememberLocationChange: _onRememberLocationChange,
  showSectionWrapper = true,
  showRememberCheckbox: _showRememberCheckbox = false,
  className = '',
}) => {
  const [isOpenCombobox, setIsOpenCombobox] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Cerrar desplegable al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpenCombobox(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Foco al input de búsqueda al abrir
  useEffect(() => {
    if (isOpenCombobox) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpenCombobox]);

  // Sincronizar cierre y limpieza de búsqueda cuando el formulario padre limpia puestoVotacion
  useEffect(() => {
    if (!puestoVotacion) {
      setIsOpenCombobox(false);
      setSearchTerm('');
    }
  }, [puestoVotacion]);

  // Puesto actual seleccionado con matching tolerante normalizado
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

  // Lista formateada y filtrada por búsqueda rápida
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
    <div className="space-y-4">
      {/* Encabezado con estado y detalle de mesas */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Ubicación Electoral
          </span>
          {municipio && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Circunscripción: {municipio} · {departamento} ({pollingPlaces.length} {pollingPlaces.length === 1 ? 'puesto' : 'puestos'})
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-medium">
          {currentFormatted
            ? `${currentFormatted.detalle} · ${totalMesas} ${totalMesas === 1 ? 'Mesa Habilitada' : 'Mesas Habilitadas'}`
            : 'Seleccione un puesto para ver mesas'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 sm:gap-4 items-start">
        {/* Selector de Municipio (cuando la circunscripción departamental o multi-municipio lo permita) */}
        {hasMultipleMunicipios && (
          <div className="col-span-1 sm:col-span-4 space-y-1.5">
            <label
              htmlFor="municipio-selector"
              className="block text-[11px] font-medium uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap truncate"
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
                className="w-full h-10.5 pl-3.5 pr-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all disabled:opacity-50 appearance-none cursor-pointer"
              >
                {availableMunicipios!.map((m) => (
                  <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {m} ({departamento})
                  </option>
                ))}
              </select>
              <Building2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Selector Desplegable Simplificado de Puesto de Votación */}
        <div className={`col-span-1 ${hasMultipleMunicipios ? 'sm:col-span-5' : 'sm:col-span-8'} space-y-1.5`} ref={dropdownRef}>
          <label
            htmlFor="puesto"
            className="block text-[11px] font-medium uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap truncate"
          >
            Puesto de Votación
          </label>

          <div className="relative">
            {/* Botón Trigger de Visualización Limpia */}
            <button
              type="button"
              id="puesto-trigger"
              disabled={disabled}
              onClick={() => setIsOpenCombobox((prev) => !prev)}
              className="w-full min-h-[42px] px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl text-left flex items-center justify-between gap-2 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {currentFormatted ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
                  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {currentFormatted.titulo}
                  </span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 w-fit">
                    {currentFormatted.detalle}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-slate-400 dark:text-slate-500 font-normal">
                  Seleccione un puesto de votación...
                </span>
              )}
              <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 shrink-0">
                <MapPin className="w-4 h-4" />
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpenCombobox ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Menú Desplegable con Búsqueda Rápida */}
            {isOpenCombobox && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Input de Búsqueda Rápida */}
                <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por colegio, corregimiento o comuna..."
                      className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Lista de Opciones Formateadas */}
                <div className="max-h-60 overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-100/50 dark:divide-slate-800/40">
                  {filteredPlaces.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                      No se encontraron puestos con ese término
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
                          className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-medium'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {p.fmtTitulo}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {p.fmtDetalle} · {p.totalMesas} {p.totalMesas === 1 ? 'Mesa' : 'Mesas'}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
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
            className="block text-[11px] font-medium uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap"
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
              className="w-full h-10.5 pl-3.5 pr-9 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs sm:text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/40 transition-all disabled:opacity-50 appearance-none cursor-pointer truncate"
            >
              <option value="" disabled className="bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 font-sans">
                {puestoVotacion ? 'Seleccionar mesa...' : 'Elige puesto...'}
              </option>
              {Array.from({ length: Math.max(1, totalMesas) }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono">
                  Mesa {m}
                </option>
              ))}
            </select>
            <Layers className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!showSectionWrapper) {
    return <div className={className}>{content}</div>;
  }

  return (
    <div
      className={`p-4 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/60 transition-colors ${className}`}
    >
      {content}
    </div>
  );
};
