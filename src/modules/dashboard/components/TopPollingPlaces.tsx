import { Building2, Inbox, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TopPollingPlace } from '../../../types';

interface TopPollingPlacesProps {
  places: TopPollingPlace[];
  totalElectores: number;
}

export const TopPollingPlaces = ({ places, totalElectores }: TopPollingPlacesProps) => {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs transition-colors">
      {/* Cabecera de la sección */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
              Concentración Territorial
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Puestos con mayor volumen y peso porcentual
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono text-blue-600 dark:text-blue-400 font-medium px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">
          Top 4 Concentración
        </span>
      </div>

      {/* Lista de Puestos o Empty State */}
      <div className="mt-5 space-y-3">
        {places.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
              <Inbox className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
              Sin registros en puestos todavía
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[260px]">
              Los puestos con mayor concentración se calcularán automáticamente con cada elector registrado.
            </p>
          </div>
        ) : (
          places.map((item, idx) => {
            const barWidth = totalElectores > 0 ? (item.total / totalElectores) * 100 : 0;
            const mesasCount = item.mesasCount ?? 1;

            return (
              <motion.div
                key={item.puesto}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.08, ease: 'easeOut' }}
                className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600/60 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="h-5 w-5 rounded-md bg-white dark:bg-slate-700/70 text-[11px] font-mono font-medium text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600/70 shadow-xs">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {item.puesto}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          <Layers className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" />
                          {mesasCount} {mesasCount === 1 ? 'mesa alcanzada' : 'mesas alcanzadas'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-baseline gap-1.5 ml-2">
                    <span className="text-xs font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      {item.total.toLocaleString('es-CO')}
                    </span>
                    <span className="text-[10px] font-mono font-medium text-blue-600 dark:text-blue-400">
                      ({item.porcentaje}%)
                    </span>
                  </div>
                </div>

                {/* Barra de progreso proporcional animada */}
                <div className="w-full bg-slate-200/80 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(barWidth, 3)}%` }}
                    transition={{ duration: 0.8, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-500 dark:to-indigo-400"
                  />
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
