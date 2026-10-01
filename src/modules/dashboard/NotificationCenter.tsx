import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  UserPlus,
  Target,
  ShieldCheck,
  Clock,
  X,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface CampaignNotification {
  id: string;
  tipo: 'elector' | 'meta' | 'lider' | 'sistema';
  titulo: string;
  descripcion: string;
  tiempo: string;
  leido: boolean;
}

interface NotificationCenterProps {
  notifications?: CampaignNotification[];
  onMarkAllAsRead?: () => void;
  className?: string;
}

const STORAGE_KEY = 'electoral_read_notifications_v1';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications: initialNotifications = [],
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Guardar notificaciones leídas en localStorage
  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
      } catch (err) {
        console.warn('Error saving read notifications:', err);
      }
      return next;
    });
  };

  const markAllAsRead = () => {
    const allIds = initialNotifications.map((n) => n.id);
    const next = new Set(allIds);
    setReadIds(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(next)));
    } catch (err) {
      console.warn('Error saving read notifications:', err);
    }
  };

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

  // Lista con estado de lectura calculado
  const items = initialNotifications.map((item) => ({
    ...item,
    leido: item.leido || readIds.has(item.id),
  }));

  const unreadCount = items.filter((n) => !n.leido).length;
  const filteredItems = filter === 'unread' ? items.filter((n) => !n.leido) : items;

  // Icono temático según el tipo de novedad
  const getIcon = (tipo: CampaignNotification['tipo']) => {
    switch (tipo) {
      case 'elector':
        return <UserPlus className="w-4 h-4 text-emerald-500" />;
      case 'meta':
        return <Target className="w-4 h-4 text-purple-500" />;
      case 'lider':
        return <ShieldCheck className="w-4 h-4 text-blue-500" />;
      case 'sistema':
      default:
        return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Botón de Campana con Badge idéntico a la referencia visual */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2.5 rounded-2xl bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-[#15223e] hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-xs touch-manipulation active:scale-95"
        title="Centro de Notificaciones"
        aria-label="Abrir centro de notificaciones"
      >
        <Bell className="w-4 h-4" />
        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#f43f5e] text-white font-bold text-[9px] flex items-center justify-center ring-2 ring-white dark:ring-[#060b17] shadow-sm">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      </button>

      {/* Popover Centro de Notificaciones */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay móvil para enfocar el panel y permitir cerrar con tap fuera */}
            <div
              className="fixed inset-0 bg-slate-950/50 z-40 sm:hidden transition-opacity"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-16 sm:top-full mt-2 w-auto sm:w-96 max-w-sm sm:max-w-none mx-auto sm:mx-0 rounded-2xl bg-white dark:bg-[#0a1224] border border-slate-200 dark:border-[#15223e] shadow-2xl z-50 text-xs backdrop-blur-xl overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[32rem]"
            >
              {/* Cabecera del Panel */}
              <div className="p-3.5 border-b border-slate-100 dark:border-[#15223e] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    Notificaciones
                  </span>
                  {unreadCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-cyan-400 font-semibold text-[10px]">
                      {unreadCount} nuevas
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold text-[10px]">
                      Al día
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Marcar leídas</span>
                    </button>
                  )}

                  {/* Botón de cierre en pantallas móviles */}
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="sm:hidden p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Cerrar notificaciones"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

            {/* Pestañas de Filtro */}
            <div className="flex items-center border-b border-slate-100 dark:border-[#15223e] px-3.5 pt-2">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`pb-2 px-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  filter === 'all'
                    ? 'border-blue-600 text-blue-600 dark:border-cyan-400 dark:text-cyan-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                Todas ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`pb-2 px-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                  filter === 'unread'
                    ? 'border-blue-600 text-blue-600 dark:border-cyan-400 dark:text-cyan-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                No leídas ({unreadCount})
              </button>
            </div>

            {/* Lista de Notificaciones Scrolleable */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-[#15223e]/60 scrollbar-thin">
              {filteredItems.length > 0 ? (
                filteredItems.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      n.leido
                        ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-75'
                        : 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/30 font-medium'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                      {getIcon(n.tipo)}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800 dark:text-slate-100 truncate text-xs">
                          {n.titulo}
                        </p>
                        {!n.leido && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-cyan-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {n.descripcion}
                      </p>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 pt-1">
                        <Clock className="w-3 h-3" />
                        <span>{n.tiempo}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sin notificaciones pendientes
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto">
                    Las novedades del padrón electoral y del equipo se registrarán aquí en tiempo real.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </div>
  );
};
