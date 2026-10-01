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

  // Paleta de gradientes modernos para las barras (conforme a diseño visual)
  const barGradients = [
    'from-cyan-400 via-blue-500 to-blue-600',
    'from-blue-600 via-indigo-500 to-purple-600',
    'from-purple-600 via-fuchsia-500 to-pink-500',
    'from-emerald-400 via-teal-500 to-cyan-500',
    'from-amber-400 via-orange-500 to-rose-500',
  ];

  return (
    <>
      <div
        className={`rounded-2xl bg-white dark:bg-[#0a1224] border border-slate-200/90 dark:border-[#162342] p-4 sm:p-5 shadow-lg flex flex-col justify-between h-[350px] transition-all ${className}`}
      >
        <div>
          {/* Cabecera con Título y Selector de Circunscripción */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#162342] mb-2.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Distribución por territorio
            </h3>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-[#0d172e] border border-slate-200 dark:border-[#162342] hover:border-slate-300 dark:hover:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer shadow-2xs transition-all touch-manipulation active:scale-95"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <span className="truncate max-w-[130px] sm:max-w-[150px]">{etiquetaActiva}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-400 transition-transform duration-200 shrink-0 ${
                    dropdownOpen ? 'rotate-180 text-blue-600 dark:text-cyan-400' : ''
                  }`}
                />
              </button>

              {/* Menú Desplegable con Tema Ejecutivo */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-3rem)] rounded-2xl bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-[#162342] shadow-2xl z-40 p-1.5 text-xs backdrop-blur-xl animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80 mb-1">
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
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer touch-manipulation ${
                            isSelected
                              ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-700 dark:text-cyan-300 font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold leading-tight">{opt.label}</span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal leading-tight">
                              {opt.desc}
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
          </div>

          {/* Lista de Puestos Interactivos (Top 5 en Tarjeta) */}
          <div className="space-y-2 pt-0.5">
            {puestosFiltrados.length === 0 ? (
              <div className="py-6 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Sin registros para esta zona
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-[220px] mx-auto">
                  No hay electores vinculados a este territorio en el período actual.
                </p>
              </div>
            ) : (
              puestosFiltrados.slice(0, 5).map((item, idx) => {
                const gradient = barGradients[idx % barGradients.length];
                return (
                  <button
                    key={item.nombrePuesto || idx}
                    type="button"
                    onClick={() => setPuestoSeleccionado(item)}
                    className="w-full text-left p-1.5 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group flex flex-col gap-1 cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 touch-manipulation"
                    title={`Ver desglose detallado de ${item.nombrePuesto}`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors truncate max-w-[170px] sm:max-w-[190px] flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400 group-hover:text-blue-500 dark:group-hover:text-cyan-400 shrink-0 transition-colors" />
                        <span className="truncate">{item.nombrePuesto}</span>
                      </span>

                      <div className="flex items-center gap-1.5 font-mono">
                        {item.totalElectores > 0 && (
                          <span className="text-[11px] text-slate-400 dark:text-slate-400">
                            ({item.totalElectores})
                          </span>
                        )}
                        <span className="font-bold text-slate-900 dark:text-white text-xs min-w-[28px] text-right">
                          {item.porcentaje}%
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 dark:group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5 shrink-0" />
                      </div>
                    </div>

                    {/* Barra de progreso interactiva con grosor h-1.5 */}
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
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

        {/* Pie de Tarjeta Interactivo con Botón para Ver Todos los Territorios */}
        <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-[#162342] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <button
            type="button"
            onClick={() => setVerTodosPuestos(true)}
            className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 font-semibold transition-colors flex items-center gap-1.5 cursor-pointer touch-manipulation group"
            title="Abrir listado completo de todos los puestos monitoreados"
          >
            <span>
              Puestos: <strong className="text-slate-900 dark:text-white font-bold">{puestosFiltrados.length}</strong>
            </span>
            <span className="text-blue-600 dark:text-cyan-400 font-bold underline group-hover:no-underline flex items-center gap-0.5 ml-0.5">
              Ver todos <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>

          <span
            className="text-blue-600 dark:text-cyan-400 font-semibold truncate max-w-[130px] sm:max-w-[140px] text-right flex items-center gap-1 text-[11px]"
            title={nombreCircunscripcion}
          >
            <MapPin className="w-3 h-3 text-blue-500 dark:text-cyan-400 shrink-0" />
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
