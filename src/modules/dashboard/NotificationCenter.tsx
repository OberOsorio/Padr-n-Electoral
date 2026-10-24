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
    setReadIds(new Set(allIds));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds));
    } catch (err) {
      console.warn('Error saving read notifications:', err);
    }
  };

  // Cerrar al hacer clic fuera o presionar Escape
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
        return <UserPlus className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />;
      case 'meta':
        return <Target className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />;
      case 'lider':
        return <ShieldCheck className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />;
      case 'sistema':
      default:
        return <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />;
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Botón de Campana con microinteracción y badge calibrado */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative p-2 rounded-xl bg-white dark:bg-[#121215] border border-slate-200/80 dark:border-white/[0.07] hover:border-slate-300 dark:hover:border-white/[0.14] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer shadow-xs touch-manipulation active:scale-[0.96]"
        title="Centro de Notificaciones"
        aria-label="Abrir centro de notificaciones"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-white font-mono font-bold text-[9px] flex items-center justify-center ring-2 ring-white dark:ring-[#09090b] shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Centro de Notificaciones */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay móvil */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden transition-opacity"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30, mass: 0.8 }}
              className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-16 sm:top-full mt-2 w-auto sm:w-96 max-w-sm sm:max-w-none mx-auto sm:mx-0 rounded-2xl bg-white dark:bg-[#18181b] border border-slate-200/90 dark:border-white/[0.08] shadow-2xl z-50 text-xs backdrop-blur-xl overflow-hidden flex flex-col max-h-[80vh] sm:max-h-[32rem]"
            >
              {/* Cabecera del Panel */}
              <div className="p-3.5 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">
                    Notificaciones
                  </span>
                  {unreadCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-white/[0.08] text-blue-600 dark:text-zinc-200 font-mono font-medium text-[10px]">
                      {unreadCount} nuevas
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.04] text-slate-500 dark:text-zinc-400 font-mono text-[10px]">
                      Al día
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-zinc-300 hover:text-blue-700 dark:hover:text-white cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Marcar leídas</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="sm:hidden p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                    aria-label="Cerrar notificaciones"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pestañas de Filtro */}
              <div className="flex items-center border-b border-slate-100 dark:border-white/[0.06] px-3.5 pt-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`pb-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                    filter === 'all'
                      ? 'border-blue-600 dark:border-zinc-100 text-blue-600 dark:text-white'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  Todas ({items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('unread')}
                  className={`pb-2 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
                    filter === 'unread'
                      ? 'border-blue-600 dark:border-zinc-100 text-blue-600 dark:text-white'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  No leídas ({unreadCount})
                </button>
              </div>

              {/* Lista de Notificaciones Scrolleable */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.04] scrollbar-thin">
                {filteredItems.length > 0 ? (
                  filteredItems.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                        n.leido
                          ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-white/[0.02] opacity-60'
                          : 'bg-blue-50/30 dark:bg-white/[0.03] hover:bg-blue-50/50 dark:hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-[#121215] border border-slate-200/60 dark:border-white/[0.06] shrink-0 mt-0.5">
                        {getIcon(n.tipo)}
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-slate-800 dark:text-zinc-100 truncate text-xs">
                            {n.titulo}
                          </p>
                          {!n.leido && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-sky-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {n.descripcion}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 dark:text-zinc-500 pt-1">
                          <Clock className="w-3 h-3" />
                          <span>{n.tiempo}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center space-y-2">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#121215] border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-center mx-auto text-slate-400 dark:text-zinc-500">
                      <Bell className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-medium text-slate-700 dark:text-zinc-300">
                      Sin notificaciones
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 max-w-[200px] mx-auto">
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
