import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export type DateRangeOption = 'today' | '7days' | '30days' | 'all';

interface DateRangeSelectorProps {
  value: DateRangeOption;
  onChange: (range: DateRangeOption) => void;
  className?: string;
}

const DATE_RANGE_OPTIONS: { id: DateRangeOption; label: string; description: string }[] = [
  { id: 'today', label: 'Hoy', description: 'Registros desde las 00:00 de hoy' },
  { id: '7days', label: 'Últimos 7 días', description: 'Semana móvil más reciente' },
  { id: '30days', label: 'Últimos 30 días', description: 'Mes móvil consolidado' },
  { id: 'all', label: 'Toda la Campaña', description: 'Histórico completo acumulado' },
];

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cierre al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen]);

  const activeOption = DATE_RANGE_OPTIONS.find((o) => o.id === value) || DATE_RANGE_OPTIONS[1];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Botón Estilo Pastilla Glassmorphic idéntico a la referencia */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-[#15223e] hover:border-slate-300 dark:hover:border-slate-700 text-[11px] sm:text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 sm:gap-2 transition-all shadow-xs cursor-pointer touch-manipulation active:scale-95 shrink-0"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="truncate max-w-[130px] sm:max-w-none">{activeOption.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-blue-600 dark:text-cyan-400' : ''
          }`}
        />
      </button>

      {/* Menú Desplegable con Tema Ejecutivo y Posicionamiento Responsive */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-[#15223e] shadow-2xl z-50 p-1.5 text-xs backdrop-blur-xl animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80 mb-1">
            Filtro de Período
          </div>

          <div className="space-y-0.5">
            {DATE_RANGE_OPTIONS.map((opt) => {
              const isSelected = value === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer touch-manipulation ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-cyan-300 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold leading-tight">{opt.label}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal leading-tight">
                      {opt.description}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
