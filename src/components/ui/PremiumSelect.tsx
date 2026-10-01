import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, type LucideIcon } from 'lucide-react';

interface PremiumSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  placeholder?: string;
  searchPlaceholder?: string;
}

export const PremiumSelect: React.FC<PremiumSelectProps> = ({
  label,
  value,
  options,
  onChange,
  icon: Icon,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filtrado dinámico sin distinción de acentos o mayúsculas
  const opcionesFiltradas = useMemo(() => {
    if (!busqueda.trim()) return options;
    const term = busqueda.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return options.filter((op) =>
      op.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(term)
    );
  }, [options, busqueda]);

  // Cierre inteligente al hacer clic fuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Autofoco al input de búsqueda cuando se abre
  useEffect(() => {
    if (isOpen) {
      setBusqueda('');
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  return (
    <div className="space-y-1.5 w-full relative" ref={containerRef}>
      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
        {label}
      </label>

      {/* Botón Disparador del Select */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between bg-slate-50 dark:bg-[#060a14] border ${
          isOpen
            ? 'border-blue-500 shadow-md shadow-blue-500/10'
            : 'border-slate-200 dark:border-[#16223e] hover:border-slate-300 dark:hover:border-slate-700'
        } rounded-xl px-3.5 py-2.5 text-sm text-left transition-all cursor-pointer`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && <Icon className="w-4 h-4 text-blue-600 dark:text-sky-400 shrink-0" />}
          <span
            className={`truncate font-semibold ${
              value ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            {value || placeholder}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : 'text-slate-400'
          }`}
        />
      </button>

      {/* Menú Desplegable Flotante Premium */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full bg-white dark:bg-[#0a1226] border border-slate-200 dark:border-[#1e325c] rounded-2xl shadow-2xl dark:shadow-black/80 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Campo de búsqueda integrado */}
          <div className="p-2.5 border-b border-slate-100 dark:border-[#162342] bg-slate-50/80 dark:bg-[#070d1c]">
            <div className="flex items-center bg-white dark:bg-[#0d1830] border border-slate-200 dark:border-[#1b2b52] rounded-xl px-2.5 py-1.5 focus-within:border-blue-500 transition-colors">
              <Search className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          {/* Lista de Opciones con Scroll Elegante */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            {opcionesFiltradas.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">
                No se encontraron resultados
              </div>
            ) : (
              opcionesFiltradas.map((opcion) => {
                const isSelected = opcion === value;
                return (
                  <button
                    key={opcion}
                    type="button"
                    onClick={() => {
                      onChange(opcion);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#132247] hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span className="truncate">{opcion}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
