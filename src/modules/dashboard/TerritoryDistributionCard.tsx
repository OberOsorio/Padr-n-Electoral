import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Check, ChevronRight, MapPin, ArrowRight } from 'lucide-react';
import { TerritoryDetailModal } from './components/TerritoryDetailModal';
import { AllTerritoriesModal } from './components/AllTerritoriesModal';

export interface PuestoElectorItem {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  edad?: number | null;
  telefono?: string | null;
  puesto_votacion?: string;
  mesa: number | string;
  registrado_por?: string | null;
  liderNombre?: string;
  created_at?: string;
}

export interface PuestoMetrica {
  nombrePuesto: string;
  rawPuesto?: string;
  zona: 'URBANA' | 'RURAL';
  totalElectores: number;
  porcentaje: number;
  mesas?: (string | number)[];
  totalMesas?: number;
  promedioElectoresPorMesa?: number;
  lideresNombres?: string[];
  electores?: PuestoElectorItem[];
}

interface TerritoryDistributionCardProps {
  puestos: PuestoMetrica[];
  nombreCircunscripcion?: string;
  onNavigateToElectorFilter?: (puestoNombre: string) => void;
  className?: string;
}

export const TerritoryDistributionCard: React.FC<TerritoryDistributionCardProps> = ({
  puestos = [],
  nombreCircunscripcion = 'Campaña Municipal',
  onNavigateToElectorFilter,
  className = '',
}) => {
  const [filtroZona, setFiltroZona] = useState<'TODOS' | 'URBANA' | 'RURAL'>('TODOS');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Estados interactivos para modales
  const [puestoSeleccionado, setPuestoSeleccionado] = useState<PuestoMetrica | null>(null);
  const [verTodosPuestos, setVerTodosPuestos] = useState(false);

  // Cerrar menú desplegable al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!dropdownOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownOpen]);

  // Filtrado reactivo según la opción seleccionada
  const puestosFiltrados = useMemo(() => {
    if (filtroZona === 'TODOS') return puestos;
    return puestos.filter((p) => p.zona === filtroZona);
  }, [puestos, filtroZona]);

  const opcionesFiltro: { id: 'TODOS' | 'URBANA' | 'RURAL'; label: string; desc: string }[] = [
    { id: 'TODOS', label: 'Todos los territorios', desc: 'Consolidado municipal completo' },
    { id: 'URBANA', label: 'Cabecera Urbana', desc: 'Puestos de votación urbanos' },
    { id: 'RURAL', label: 'Zona Rural / Corregimientos', desc: 'Veredas y corregimientos' },
  ];

  const etiquetaActiva =
    opcionesFiltro.find((o) => o.id === filtroZona)?.label || 'Todos los territorios';

  return (
    <>
      <div
        className={`rounded-2xl bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.07] p-4 sm:p-5 shadow-xs flex flex-col justify-between h-[350px] transition-colors duration-200 ${className}`}
      >
        <div>
          {/* Cabecera con Título y Selector de Circunscripción */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-white/[0.06] mb-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100 tracking-tight">
              Distribución por territorio
            </h3>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/[0.12] text-[11px] font-medium text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer transition-all touch-manipulation active:scale-[0.98]"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <span className="truncate max-w-[130px] sm:max-w-[150px]">{etiquetaActiva}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 transition-transform duration-200 shrink-0 ${
                    dropdownOpen ? 'rotate-180 text-blue-600 dark:text-zinc-100' : ''
                  }`}
                />
              </button>

              {/* Menú Desplegable con Tema Calibrado */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-64 max-w-[calc(100vw-3rem)] rounded-xl bg-white dark:bg-[#18181b] border border-slate-200/90 dark:border-white/[0.08] shadow-xl z-40 p-1.5 text-xs backdrop-blur-xl animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-zinc-500 border-b border-slate-100 dark:border-white/[0.06] mb-1">
                    Filtrar por Zona
                  </div>

                  <div className="space-y-0.5">
                    {opcionesFiltro.map((opt) => {
                      const isSelected = filtroZona === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setFiltroZona(opt.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer touch-manipulation active:scale-[0.99] ${
                            isSelected
                              ? 'bg-blue-50/80 dark:bg-white/[0.08] text-blue-700 dark:text-white font-semibold'
                              : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-100/70 dark:hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="flex flex-col min-w-0 pr-2">
                            <span className="leading-tight truncate font-medium">{opt.label}</span>
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-normal leading-tight mt-0.5">
                              {opt.desc}
                            </span>
                          </div>
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-blue-600 dark:text-zinc-100 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lista de Puestos Interactivos (Top 5 en Tarjeta) */}
          <div className="space-y-1.5 pt-0.5">
            {puestosFiltrados.length === 0 ? (
              <div className="py-8 text-center space-y-1">
                <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Sin registros para esta zona
                </p>
                <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-[220px] mx-auto">
                  No hay electores vinculados a este territorio en el período actual.
                </p>
              </div>
            ) : (
              puestosFiltrados.slice(0, 5).map((item, idx) => {
                return (
                  <button
                    key={item.nombrePuesto || idx}
                    type="button"
                    onClick={() => setPuestoSeleccionado(item)}
                    className="w-full text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all group flex flex-col gap-1 cursor-pointer border border-transparent hover:border-slate-200/60 dark:hover:border-white/[0.06] touch-manipulation active:scale-[0.99]"
                    title={`Ver desglose detallado de ${item.nombrePuesto}`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate max-w-[170px] sm:max-w-[190px] flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400 dark:text-zinc-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 shrink-0 transition-colors" />
                        <span className="truncate">{item.nombrePuesto}</span>
                      </span>

                      <div className="flex items-center gap-1.5 font-mono tabular-nums">
                        {item.totalElectores > 0 && (
                          <span className="text-[11px] text-slate-400 dark:text-zinc-500">
                            ({item.totalElectores})
                          </span>
                        )}
                        <span className="font-semibold text-slate-900 dark:text-white text-xs min-w-[28px] text-right">
                          {item.porcentaje}%
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-300 dark:text-zinc-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5 shrink-0" />
                      </div>
                    </div>

                    {/* Barra de progreso calibrada */}
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600 dark:bg-sky-500 transition-all duration-500"
                        style={{
                          width: `${Math.max(item.porcentaje, item.totalElectores > 0 ? 5 : 0)}%`,
                        }}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Pie de Tarjeta Interactivo */}
        <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <button
            type="button"
            onClick={() => setVerTodosPuestos(true)}
            className="text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors flex items-center gap-1.5 cursor-pointer touch-manipulation group active:scale-[0.98]"
            title="Abrir listado completo de todos los puestos monitoreados"
          >
            <span>
              Puestos: <strong className="text-slate-900 dark:text-white font-mono tabular-nums">{puestosFiltrados.length}</strong>
            </span>
            <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5 ml-0.5 group-hover:underline">
              Ver todos <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>

          <span
            className="text-slate-500 dark:text-zinc-400 font-medium truncate max-w-[130px] sm:max-w-[140px] text-right flex items-center gap-1 text-[11px]"
            title={nombreCircunscripcion}
          >
            <MapPin className="w-3 h-3 text-slate-400 dark:text-zinc-500 shrink-0" />
            <span className="truncate">{nombreCircunscripcion}</span>
          </span>
        </div>
      </div>

      {/* MODAL 1: Desglose Detallado del Puesto Seleccionado */}
      <TerritoryDetailModal
        isOpen={Boolean(puestoSeleccionado)}
        onClose={() => setPuestoSeleccionado(null)}
        puesto={puestoSeleccionado}
        nombreCircunscripcion={nombreCircunscripcion}
        onNavigateToElectorFilter={onNavigateToElectorFilter}
      />

      {/* MODAL 2: Listado Completo Consolidado de Todos los Territorios */}
      <AllTerritoriesModal
        isOpen={verTodosPuestos}
        onClose={() => setVerTodosPuestos(false)}
        puestos={puestos}
        nombreCircunscripcion={nombreCircunscripcion}
        onSelectPuesto={(p) => {
          setVerTodosPuestos(false);
          setPuestoSeleccionado(p);
        }}
      />
    </>
  );
};
