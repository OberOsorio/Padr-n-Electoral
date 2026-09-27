import React from 'react';
import { User, MapPin, Inbox, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ElectorWithRegistrant } from '../../../types';

interface RecentElectorsFeedProps {
  electors: ElectorWithRegistrant[];
  isLive?: boolean;
  onNavigateToElectors?: () => void;
}

// Función auxiliar para obtener iniciales
const getInitials = (nombres: string, apellidos: string): string => {
  const n = (nombres || '').trim().charAt(0);
  const a = (apellidos || '').trim().charAt(0);
  return (n + a).toUpperCase() || 'EL';
};

// Formato de tiempo relativo en español
const formatRelativeTime = (isoDate: string): string => {
  try {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 45) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHours === 1) return 'Hace 1 hora';
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays === 1) return 'Ayer';
    return `Hace ${diffDays} días`;
  } catch {
    return 'Reciente';
  }
};

// Formato de documento con puntos para legibilidad
const formatDocument = (doc: string): string => {
  if (!doc) return 'Sin doc.';
  const clean = doc.replace(/\D/g, '');
  if (!clean) return doc;
  return new Intl.NumberFormat('es-CO').format(Number(clean));
};

export const RecentElectorsFeed: React.FC<RecentElectorsFeedProps> = ({
  electors,
  isLive = true,
  onNavigateToElectors,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl backdrop-blur-md flex flex-col justify-between transition-colors h-full">
      <div>
        {/* 1. Encabezado */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              Últimos Electores Registrados
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Flujo de ingresos en tiempo real
            </p>
          </div>

          {/* Badge Realtime Pulsante */}
          <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1.5 shrink-0">
            <span className="relative flex h-1.5 w-1.5">
              {isLive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span>En vivo</span>
          </div>
        </div>

        {/* 2. Lista de Electores o Empty State */}
        {electors.length === 0 ? (
          <div className="p-8 sm:p-14 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2.5">
              <Inbox className="w-5 h-5" />
            </div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 max-w-xs leading-relaxed">
              Sin registros hoy. Los nuevos electores aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            <AnimatePresence initial={false}>
              {electors.map((elector) => {
                const fullName = `${elector.nombres} ${elector.apellidos}`.trim() || 'Elector Registrado';
                const registradorName = elector.registrador?.full_name || 'Líder de Campaña';

                return (
                  <motion.div
                    key={elector.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 sm:p-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3"
                  >
                    {/* Información Principal */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar Iniciales */}
                      <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/50 flex items-center justify-center text-xs font-semibold text-blue-700 dark:text-blue-300 shrink-0">
                        {getInitials(elector.nombres, elector.apellidos)}
                      </div>

                      <div className="min-w-0">
                        {/* Nombre y Cédula en monospace */}
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 tracking-tight truncate max-w-[150px] sm:max-w-[210px]">
                            {fullName}
                          </span>
                          <span className="font-mono text-[11px] font-medium text-slate-500 dark:text-slate-400 shrink-0">
                            C.C. {formatDocument(elector.cedula)}
                          </span>
                        </div>

                        {/* Puesto y Mesa */}
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate max-w-[150px] sm:max-w-[230px]">
                            {elector.puesto_votacion}
                          </span>
                          {elector.mesa ? (
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded text-[10px] font-mono border border-slate-200 dark:border-slate-700/60 shrink-0">
                              Mesa {elector.mesa}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Registrador y Hora Relativa */}
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap block">
                        {formatRelativeTime(elector.created_at)}
                      </span>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                        <User className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate max-w-[90px] sm:max-w-[120px]">
                          {registradorName}
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

      {/* 3. Botón al Pie */}
      {onNavigateToElectors && (
        <div className="p-3 text-center border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={onNavigateToElectors}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 flex items-center justify-center gap-1.5 transition-colors group cursor-pointer w-full py-1"
          >
            <span>Ver Padrón Completo</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      )}
    </div>
  );
};
