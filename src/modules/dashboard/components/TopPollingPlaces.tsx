import React from 'react';
import { Building2, Inbox } from 'lucide-react';
import { motion } from 'framer-motion';
import type { TopPollingPlace } from '../../../types';

interface TopPollingPlacesProps {
  places: TopPollingPlace[];
  totalElectores: number;
}

export const TopPollingPlaces: React.FC<TopPollingPlacesProps> = ({
  places,
  totalElectores,
}) => {
  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900/60 backdrop-blur-md border border-slate-200 dark:border-slate-800/80 p-5 sm:p-6 shadow-xs dark:shadow-xl transition-colors h-full flex flex-col justify-between">
      <div>
        {/* Cabecera de la sección */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">
                Electores por Puesto de Votación
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Distribución y concentración territorial de votantes
              </p>
            </div>
          </div>
          {places.length > 0 && (
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              {places.length} {places.length === 1 ? 'Puesto activo' : 'Puestos activos'}
            </span>
          )}
        </div>

        {/* Lista de Puestos o Empty State */}
        <div className="mt-4 space-y-3">
          {places.length === 0 ? (
            <div className="py-14 flex flex-col items-center justify-center text-center">
              <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
                <Inbox className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                Aún no hay electores asignados a puestos de votación
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-[280px]">
                A medida que se registren o importen electores, la distribución territorial se reflejará aquí.
              </p>
            </div>
          ) : (
            places.map((item, idx) => {
              const barWidth = totalElectores > 0 ? (item.total / totalElectores) * 100 : 0;
              const displayZone = item.zona || 'Zona Urbana';

              return (
                <motion.div
                  key={item.puesto}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.05, ease: 'easeOut' }}
                  className="p-3 sm:p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600/60 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="h-5 w-5 rounded-md bg-white dark:bg-slate-700/70 text-[11px] font-mono font-medium text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-600/70 shadow-xs">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.puesto}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {displayZone} {item.mesasCount ? `• ${item.mesasCount} ${item.mesasCount === 1 ? 'mesa' : 'mesas'}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-baseline gap-1.5 ml-2">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                        {item.total.toLocaleString('es-CO')}
                      </span>
                      <span className="text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
                        ({item.porcentaje}%)
                      </span>
                    </div>
                  </div>

                  {/* Barra de progreso visual proporcional */}
                  <div className="w-full bg-slate-200/80 dark:bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(barWidth, 3)}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 dark:from-emerald-400 dark:to-teal-400"
                    />
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
