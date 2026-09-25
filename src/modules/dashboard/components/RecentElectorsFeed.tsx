import React from 'react';
import { Activity, MapPin, User, Inbox, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ElectorWithRegistrant } from '../../../types';

interface RecentElectorsFeedProps {
  electors: ElectorWithRegistrant[];
  isLive?: boolean;
  onQuickRegister?: () => void;
  onNavigateToElectors?: () => void;
}

// Función auxiliar para obtener iniciales del elector
const getInitials = (nombres: string, apellidos: string): string => {
  const n = (nombres || '').trim().charAt(0);
  const a = (apellidos || '').trim().charAt(0);
  return (n + a).toUpperCase() || 'EL';
};

// Función auxiliar para formatear tiempo relativo compacto en español
const formatRelativeTime = (isoDate: string): string => {
  try {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return 'Hace unos seg';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHours === 1) return 'Hace 1h';
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Hace 1d';
    return `Hace ${diffDays}d`;
  } catch {
    return 'Reciente';
  }
};

// Función auxiliar para enmascarar documento por privacidad institucional
const maskDocument = (doc: string): string => {
  if (!doc) return 'C.C. **********';
  const clean = doc.replace(/\D/g, '');
  if (clean.length <= 4) return `C.C. ${clean}`;
  const start = clean.slice(0, 3);
  const end = clean.slice(-3);
  return `C.C. ${start}.***.${end}`;
};

export const RecentElectorsFeed: React.FC<RecentElectorsFeedProps> = ({
  electors,
  isLive = true,
  onQuickRegister,
  onNavigateToElectors,
}) => {
  const handleViewAll = () => {
    if (onNavigateToElectors) {
      onNavigateToElectors();
    } else if (onQuickRegister) {
      onQuickRegister();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl backdrop-blur-md flex flex-col justify-between transition-colors">
      <div>
        {/* 1. Encabezado */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Últimos Registros
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Flujo de electores ingresados en vivo
              </p>
            </div>
          </div>

          {/* Badge Realtime con Halo Pulsante */}
          <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1.5 shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              {isLive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span>Realtime</span>
          </div>
        </div>

        {/* 2. Estructura de Lista Corrida (Flat Feed) */}
        {electors.length === 0 ? (
          /* Estado Vacío (Empty State) */
          <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-400 mb-2">
              <Inbox className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              No hay registros recientes hoy. Los nuevos ingresos aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            <AnimatePresence initial={false}>
              {electors.map((elector) => {
                const registradorName =
                  elector.registrador?.full_name || 'Personal Autorizado';

                return (
                  <motion.div
                    key={elector.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3"
                  >
                    {/* Lado Izquierdo (Avatar + Información) */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Mini Avatar con Iniciales */}
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0">
                        {getInitials(elector.nombres, elector.apellidos)}
                      </div>

                      {/* Contenedor de Datos */}
                      <div className="min-w-0">
                        {/* Fila 1: Nombre completo + Cédula enmascarada */}
                        <div className="flex items-baseline">
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 tracking-tight truncate max-w-[130px] sm:max-w-[200px]">
                            {`${elector.nombres} ${elector.apellidos}`.trim() || 'Elector'}
                          </span>
                          <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-medium ml-2 shrink-0">
                            {maskDocument(elector.cedula)}
                          </span>
                        </div>

                        {/* Fila 2: MapPin + Puesto + Badge Mesa */}
                        <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[140px] sm:max-w-[210px]">
                            {elector.puesto_votacion}
                          </span>
                          {elector.mesa ? (
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-700/60 ml-1.5 shrink-0 inline-block">
                              M-{elector.mesa}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Lado Derecho (Operador y Tiempo) */}
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-400 whitespace-nowrap text-right block">
                        {formatRelativeTime(elector.created_at)}
                      </span>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                        <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[90px] sm:max-w-[130px]">
                          Por: {registradorName}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* 3. Pie del Componente (Enlace al Padrón) */}
      <div className="p-3 text-center border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
        <button
          type="button"
          onClick={handleViewAll}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center justify-center gap-1.5 transition-colors group cursor-pointer w-full"
        >
          <span>Ver todos los electores en el Padrón</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
};
