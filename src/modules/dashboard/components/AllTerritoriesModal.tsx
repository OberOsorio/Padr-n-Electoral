import React, { useState, useMemo } from 'react';
import {
  MapPin,
  X,
  Search,
  ChevronRight,
  Building2,
  TreePine,
} from 'lucide-react';
import type { PuestoMetrica } from '../TerritoryDistributionCard';

interface AllTerritoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  puestos: PuestoMetrica[];
  nombreCircunscripcion?: string;
  onSelectPuesto: (puesto: PuestoMetrica) => void;
}

export const AllTerritoriesModal: React.FC<AllTerritoriesModalProps> = ({
  isOpen,
  onClose,
  puestos = [],
  nombreCircunscripcion = 'Campaña Municipal',
  onSelectPuesto,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroZona, setFiltroZona] = useState<'TODOS' | 'URBANA' | 'RURAL'>('TODOS');

  // Conteo por zona
  const stats = useMemo(() => {
    const totalPuestos = puestos.length;
    const urbanos = puestos.filter((p) => p.zona === 'URBANA').length;
    const rurales = puestos.filter((p) => p.zona === 'RURAL').length;
    const totalElectores = puestos.reduce((acc, p) => acc + p.totalElectores, 0);
    return { totalPuestos, urbanos, rurales, totalElectores };
  }, [puestos]);

  // Filtrado reactivo de puestos
  const filteredPuestos = useMemo(() => {
    return puestos.filter((p) => {
      const matchesZone = filtroZona === 'TODOS' || p.zona === filtroZona;
      const matchesSearch =
        searchTerm.trim() === '' ||
        p.nombrePuesto.toLowerCase().includes(searchTerm.toLowerCase().trim());
      return matchesZone && matchesSearch;
    });
  }, [puestos, filtroZona, searchTerm]);

  if (!isOpen) return null;

  const barGradients = [
    'from-cyan-400 via-blue-500 to-blue-600',
    'from-blue-500 via-indigo-500 to-indigo-600',
    'from-purple-500 via-violet-500 to-fuchsia-600',
    'from-emerald-400 via-teal-500 to-cyan-500',
    'from-amber-400 via-orange-500 to-rose-500',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#0a1224] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-[#15223e] shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* 1. CABECERA */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-[#15223e] flex items-center justify-between bg-slate-50/70 dark:bg-[#070D1F]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 border border-blue-200/60 dark:border-blue-800/40">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Consolidado de Puestos de Votación
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {nombreCircunscripcion} · {stats.totalPuestos} puestos monitoreados ({stats.totalElectores} electores)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. FILTROS Y BÚSQUEDA */}
        <div className="p-3.5 sm:p-5 border-b border-slate-100 dark:border-[#15223e] bg-white dark:bg-[#0a1224] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar puesto de votación..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#070D1F] border border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtros de Zona */}
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 dark:bg-[#070D1F] p-1 rounded-xl border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setFiltroZona('TODOS')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filtroZona === 'TODOS'
                  ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos ({stats.totalPuestos})
            </button>
            <button
              type="button"
              onClick={() => setFiltroZona('URBANA')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                filtroZona === 'URBANA'
                  ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>Urbana ({stats.urbanos})</span>
            </button>
            <button
              type="button"
              onClick={() => setFiltroZona('RURAL')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                filtroZona === 'RURAL'
                  ? 'bg-white dark:bg-blue-600 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TreePine className="w-3 h-3" />
              <span>Rural ({stats.rurales})</span>
            </button>
          </div>
        </div>

        {/* 3. LISTADO COMPLETO DE PUESTOS */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-2.5 max-h-[500px]">
          {filteredPuestos.length === 0 ? (
            <div className="py-12 text-center space-y-1">
              <MapPin className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                No se encontraron puestos
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Prueba restableciendo los criterios de búsqueda o filtros de zona.
              </p>
            </div>
          ) : (
            filteredPuestos.map((puesto, idx) => {
              const gradient = barGradients[idx % barGradients.length];
              const rankColor =
                idx === 0
                  ? 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                  : idx === 1
                  ? 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                  : idx === 2
                  ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950/60 dark:text-orange-400 dark:border-orange-800'
                  : 'bg-slate-100 text-slate-500 border-transparent dark:bg-slate-800/60 dark:text-slate-400';

              return (
                <button
                  key={puesto.nombrePuesto || idx}
                  type="button"
                  onClick={() => onSelectPuesto(puesto)}
                  className="w-full text-left p-3.5 rounded-2xl bg-white dark:bg-[#070D1F] border border-slate-200/80 dark:border-[#15223e] hover:border-blue-500/60 dark:hover:border-blue-500/60 hover:shadow-md transition-all group flex flex-col gap-2 cursor-pointer touch-manipulation"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-bold font-mono flex items-center justify-center shrink-0 border ${rankColor}`}
                      >
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors truncate block">
                          {puesto.nombrePuesto}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                          <span
                            className={`px-1.5 py-0.2 rounded font-medium ${
                              puesto.zona === 'RURAL'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {puesto.zona === 'RURAL' ? 'Rural' : 'Urbano'}
                          </span>
                          <span>·</span>
                          <span>{puesto.totalMesas || puesto.mesas?.length || 1} mesas</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
                            ({puesto.totalElectores})
                          </span>
                          <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                            {puesto.porcentaje}%
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
                      style={{
                        width: `${Math.max(puesto.porcentaje, puesto.totalElectores > 0 ? 4 : 0)}%`,
                      }}
                    />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* 4. PIE */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 dark:border-[#15223e] bg-slate-50/50 dark:bg-[#070D1F]/50 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <span>Haz clic en cualquier puesto para ver el desglose de votantes y mesas.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-colors cursor-pointer text-xs"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
