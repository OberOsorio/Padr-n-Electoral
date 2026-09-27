import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MapPin, Search, ChevronDown, Check, X } from 'lucide-react';
import { COLOMBIA_GEO_DATA, type DepartamentoColombia } from '../../data/colombiaGeoData';

interface ColombiaGeoSelectorProps {
  departamento: string;
  municipio: string;
  onDepartamentoChange: (depto: string) => void;
  onMunicipioChange: (muni: string) => void;
  disabled?: boolean;
}

// Función auxiliar para normalizar cadenas (sin acentos, minúsculas)
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

export const ColombiaGeoSelector: React.FC<ColombiaGeoSelectorProps> = ({
  departamento,
  municipio,
  onDepartamentoChange,
  onMunicipioChange,
  disabled = false,
}) => {
  // Estados para abrir/cerrar desplegables
  const [isOpenDepto, setIsOpenDepto] = useState(false);
  const [isOpenMuni, setIsOpenMuni] = useState(false);

  // Estados para búsquedas de texto rápido
  const [searchDepto, setSearchDepto] = useState('');
  const [searchMuni, setSearchMuni] = useState('');

  // Referencias para cerrar al hacer clic fuera
  const deptoRef = useRef<HTMLDivElement>(null);
  const muniRef = useRef<HTMLDivElement>(null);
  const searchDeptoInputRef = useRef<HTMLInputElement>(null);
  const searchMuniInputRef = useRef<HTMLInputElement>(null);

  // Cerrar desplegables al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deptoRef.current && !deptoRef.current.contains(event.target as Node)) {
        setIsOpenDepto(false);
      }
      if (muniRef.current && !muniRef.current.contains(event.target as Node)) {
        setIsOpenMuni(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Enfocar automáticamente el input de búsqueda al abrir
  useEffect(() => {
    if (isOpenDepto) {
      setTimeout(() => searchDeptoInputRef.current?.focus(), 50);
    } else {
      setSearchDepto('');
    }
  }, [isOpenDepto]);

  useEffect(() => {
    if (isOpenMuni) {
      setTimeout(() => searchMuniInputRef.current?.focus(), 50);
    } else {
      setSearchMuni('');
    }
  }, [isOpenMuni]);

  // Encontrar el objeto de departamento seleccionado
  const selectedDeptoObj = useMemo(() => {
    if (!departamento) return null;
    const norm = normalizeString(departamento);
    return COLOMBIA_GEO_DATA.find(
      (d) => normalizeString(d.nombre) === norm || d.id === norm
    );
  }, [departamento]);

  // Lista de municipios según el departamento seleccionado
  const availableMunicipios = useMemo(() => {
    return selectedDeptoObj ? selectedDeptoObj.municipios : [];
  }, [selectedDeptoObj]);

  // Departamentos filtrados por búsqueda
  const filteredDepartamentos = useMemo(() => {
    if (!searchDepto.trim()) return COLOMBIA_GEO_DATA;
    const term = normalizeString(searchDepto);
    return COLOMBIA_GEO_DATA.filter((d) =>
      normalizeString(d.nombre).includes(term)
    );
  }, [searchDepto]);

  // Municipios filtrados por búsqueda
  const filteredMunicipios = useMemo(() => {
    if (!searchMuni.trim()) return availableMunicipios;
    const term = normalizeString(searchMuni);
    return availableMunicipios.filter((m) =>
      normalizeString(m).includes(term)
    );
  }, [availableMunicipios, searchMuni]);

  // Seleccionar departamento
  const handleSelectDepto = (d: DepartamentoColombia) => {
    onDepartamentoChange(d.nombre);
    setIsOpenDepto(false);

    // Si el municipio actual no pertenece al nuevo departamento, limpiarlo
    if (municipio && !d.municipios.includes(municipio)) {
      onMunicipioChange('');
    }

    // Si el departamento tiene solo 1 municipio (como Bogotá D.C.), auto-seleccionarlo
    if (d.municipios.length === 1) {
      onMunicipioChange(d.municipios[0]);
    } else {
      // Abrir el selector de municipio automáticamente para mayor fluidez
      setTimeout(() => setIsOpenMuni(true), 150);
    }
  };

  // Limpiar departamento
  const handleClearDepto = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDepartamentoChange('');
    onMunicipioChange('');
  };

  // Seleccionar municipio
  const handleSelectMuni = (m: string) => {
    onMunicipioChange(m);
    setIsOpenMuni(false);
  };

  // Limpiar municipio
  const handleClearMuni = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMunicipioChange('');
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* 1. COMBOBOX DEPARTAMENTO */}
      <div className="space-y-1 relative" ref={deptoRef}>
        <label className="text-[11px] font-mono uppercase font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-purple-500" />
            <span>Departamento (Opcional)</span>
          </span>
          {departamento && (
            <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400">
              {availableMunicipios.length} municipios
            </span>
          )}
        </label>

        {/* Botón Disparador */}
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setIsOpenDepto(!isOpenDepto)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              !disabled && setIsOpenDepto(!isOpenDepto);
            }
          }}
          className={`w-full h-10 px-3 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all select-none ${
            isOpenDepto
              ? 'border-purple-500 ring-1 ring-purple-500/30'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`truncate ${
              departamento
                ? 'font-medium text-slate-900 dark:text-white'
                : 'text-slate-400'
            }`}
          >
            {departamento || 'Seleccionar departamento...'}
          </span>

          <div className="flex items-center gap-1 ml-1.5 shrink-0">
            {departamento && !disabled && (
              <button
                type="button"
                onClick={handleClearDepto}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                title="Limpiar departamento"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                isOpenDepto ? 'rotate-180 text-purple-500' : ''
              }`}
            />
          </div>
        </div>

        {/* Menú Desplegable con Búsqueda Rápida */}
        {isOpenDepto && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
            {/* Input de Búsqueda Integrado */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchDeptoInputRef}
                  type="text"
                  value={searchDepto}
                  onChange={(e) => setSearchDepto(e.target.value)}
                  placeholder="Buscar entre 32 departamentos..."
                  className="w-full h-8 pl-8 pr-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Lista Scrollable */}
            <div className="max-h-52 overflow-y-auto py-1 divide-y divide-slate-100/50 dark:divide-slate-800/40">
              {filteredDepartamentos.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-slate-400">
                  No se encontró ningún departamento con "{searchDepto}".
                </div>
              ) : (
                filteredDepartamentos.map((d) => {
                  const isSelected =
                    normalizeString(departamento) === normalizeString(d.nombre);

                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => handleSelectDepto(d)}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <div className="flex flex-col min-w-0 pr-2">
                        <span className="truncate">{d.nombre}</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {d.municipios.length} municipios
                        </span>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* 2. COMBOBOX MUNICIPIO EN CASCADA */}
      <div className="space-y-1 relative" ref={muniRef}>
        <label className="text-[11px] font-mono uppercase font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-purple-500" />
            <span>Municipio (Opcional)</span>
          </span>
          {departamento && (
            <span className="text-[9px] font-mono text-slate-400">
              {municipio ? '1 seleccionado' : `${availableMunicipios.length} disponibles`}
            </span>
          )}
        </label>

        {/* Botón Disparador */}
        <div
          role="button"
          tabIndex={disabled || !departamento ? -1 : 0}
          onClick={() => {
            if (disabled) return;
            if (!departamento) {
              setIsOpenDepto(true);
              return;
            }
            setIsOpenMuni(!isOpenMuni);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (!disabled && departamento) setIsOpenMuni(!isOpenMuni);
            }
          }}
          className={`w-full h-10 px-3 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-xs flex items-center justify-between transition-all select-none ${
            !departamento
              ? 'border-slate-200 dark:border-slate-800 text-slate-400 opacity-75 cursor-pointer hover:border-purple-300 dark:hover:border-purple-800'
              : isOpenMuni
              ? 'border-purple-500 ring-1 ring-purple-500/30 cursor-pointer'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 cursor-pointer'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`truncate ${
              municipio
                ? 'font-medium text-slate-900 dark:text-white'
                : 'text-slate-400'
            }`}
          >
            {!departamento
              ? '← Elija depto primero'
              : municipio || `Seleccionar en ${departamento}...`}
          </span>

          <div className="flex items-center gap-1 ml-1.5 shrink-0">
            {municipio && !disabled && (
              <button
                type="button"
                onClick={handleClearMuni}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                title="Limpiar municipio"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                isOpenMuni ? 'rotate-180 text-purple-500' : ''
              }`}
            />
          </div>
        </div>

        {/* Menú Desplegable con Búsqueda Rápida */}
        {isOpenMuni && departamento && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
            {/* Input de Búsqueda Integrado */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchMuniInputRef}
                  type="text"
                  value={searchMuni}
                  onChange={(e) => setSearchMuni(e.target.value)}
                  placeholder={`Buscar en ${departamento}...`}
                  className="w-full h-8 pl-8 pr-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Lista Scrollable */}
            <div className="max-h-52 overflow-y-auto py-1 divide-y divide-slate-100/50 dark:divide-slate-800/40">
              {filteredMunicipios.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-slate-400">
                  No se encontró ningún municipio con "{searchMuni}".
                </div>
              ) : (
                filteredMunicipios.map((m) => {
                  const isSelected =
                    normalizeString(municipio) === normalizeString(m);

                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleSelectMuni(m)}
                      className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span className="truncate">{m}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
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
  );
};
