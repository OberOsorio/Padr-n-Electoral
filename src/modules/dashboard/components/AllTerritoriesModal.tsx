import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Search,
  ChevronRight,
  Building2,
  TreePine,
  X,
} from 'lucide-react';
import type { PuestoMetrica } from '../TerritoryDistributionCard';
import { Modal } from '../../../components/ui/Modal';

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

  return (
    <Modal.Root open={isOpen} onClose={onClose} variant="default">
      <Modal.Content maxWidth="max-w-3xl" className="dark:bg-[#121215] dark:border-white/[0.08]">
        {/* 1. CABECERA */}
        <Modal.Header className="dark:bg-[#18181b]/50 border-b border-slate-100 dark:border-white/[0.06] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <Modal.Title className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Consolidado de Puestos de Votación
              </Modal.Title>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {nombreCircunscripcion} · {stats.totalPuestos} puestos monitoreados (<span className="font-mono tabular-nums">{stats.totalElectores}</span> electores)
              </p>
            </div>
          </div>
          <Modal.CloseButton />
        </Modal.Header>

        {/* 2. FILTROS Y BÚSQUEDA */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-white/[0.06] bg-white dark:bg-[#121215] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar puesto de votación..."
              className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.07] text-slate-800 dark:text-zinc-200 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtros de Zona */}
          <div className="flex items-center gap-1 shrink-0 bg-slate-100 dark:bg-[#18181b] p-1 rounded-xl border border-slate-200/80 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => setFiltroZona('TODOS')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                filtroZona === 'TODOS'
                  ? 'bg-white dark:bg-white/[0.1] text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos ({stats.totalPuestos})
            </button>
            <button
              type="button"
              onClick={() => setFiltroZona('URBANA')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                filtroZona === 'URBANA'
                  ? 'bg-white dark:bg-white/[0.1] text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>Urbana ({stats.urbanos})</span>
            </button>
            <button
              type="button"
              onClick={() => setFiltroZona('RURAL')}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                filtroZona === 'RURAL'
                  ? 'bg-white dark:bg-white/[0.1] text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TreePine className="w-3 h-3" />
              <span>Rural ({stats.rurales})</span>
            </button>
          </div>
        </div>

        {/* 3. LISTADO COMPLETO DE PUESTOS */}
        <Modal.Body className="p-3.5 sm:p-4 space-y-2 max-h-[460px] overflow-y-auto">
          {filteredPuestos.length === 0 ? (
            <div className="py-12 text-center space-y-1">
              <MapPin className="w-8 h-8 text-slate-300 dark:text-zinc-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                No se encontraron puestos
              </p>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500">
                Prueba restableciendo los criterios de búsqueda o filtros de zona.
              </p>
            </div>
          ) : (
            filteredPuestos.map((puesto, idx) => {
              const rankColor =
                idx === 0
                  ? 'bg-amber-100/80 text-amber-800 border-amber-300/80 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                  : idx === 1
                  ? 'bg-slate-200/80 text-slate-700 border-slate-300/80 dark:bg-white/[0.06] dark:text-zinc-300 dark:border-white/[0.08]'
                  : idx === 2
                  ? 'bg-orange-100/80 text-orange-800 border-orange-300/80 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/20'
                  : 'bg-slate-100 text-slate-500 border-transparent dark:bg-white/[0.03] dark:text-zinc-400';

              return (
                <button
                  key={puesto.nombrePuesto || idx}
                  type="button"
                  onClick={() => onSelectPuesto(puesto)}
                  className="w-full text-left p-3 rounded-xl bg-white dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.06] hover:border-blue-500/50 dark:hover:border-white/[0.14] transition-all group flex flex-col gap-2 cursor-pointer touch-manipulation active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-bold font-mono flex items-center justify-center shrink-0 border ${rankColor}`}
                      >
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold text-xs text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate block">
                          {puesto.nombrePuesto}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-zinc-500">
                          <span
                            className={`font-medium ${
                              puesto.zona === 'RURAL'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-blue-600 dark:text-blue-400'
                            }`}
                          >
                            {puesto.zona === 'RURAL' ? 'Rural' : 'Urbano'}
                          </span>
                          <span>·</span>
                          <span className="font-mono tabular-nums">{puesto.totalMesas || puesto.mesas?.length || 1} mesas</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1.5 font-mono tabular-nums">
                          <span className="text-xs text-slate-400 dark:text-zinc-500">
                            ({puesto.totalElectores})
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {puesto.porcentaje}%
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 dark:text-zinc-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  {/* Barra de progreso calibrada */}
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600 dark:bg-sky-500 transition-all duration-500"
                      style={{
                        width: `${Math.max(puesto.porcentaje, puesto.totalElectores > 0 ? 4 : 0)}%`,
                      }}
                    />
                  </div>
                </button>
              );
            })
          )}
        </Modal.Body>

        {/* 4. PIE */}
        <Modal.Footer className="border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#18181b]/30 p-3.5 sm:p-4 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <span>Haz clic en cualquier puesto para ver el desglose de votantes y mesas.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-zinc-200 font-medium transition-colors cursor-pointer text-xs active:scale-[0.98]"
          >
            Cerrar
          </button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};
