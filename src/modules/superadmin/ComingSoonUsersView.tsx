import React from 'react';
import { Users, Clock, Sparkles } from 'lucide-react';

export const ComingSoonUsersView: React.FC = () => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full text-center bg-[#0a1020]/80 dark:bg-[#0a1020]/80 border border-slate-200 dark:border-[#16223e] rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Resplandor decorativo de fondo */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Icono central */}
        <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-600/10 border border-purple-500/20 text-purple-400 mb-6 shadow-lg shadow-purple-600/10">
          <Users className="w-8 h-8"/>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500" />
          </span>
        </div>

        {/* Títulos y Descripción */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/40 border border-purple-800/40 text-purple-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5"/>
          <span>Módulo en Desarrollo</span>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Gestión Global de Usuarios
        </h2>

        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
          Próximamente estará disponible la administración centralizada de directores, administradores de campaña y credenciales de acceso institucional.
        </p>

        {/* Micro-tarjeta de estado */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070b16] border border-slate-200 dark:border-[#141e36] text-xs text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 text-purple-400 shrink-0"/>
          <span>Programado para la siguiente versión de la plataforma</span>
        </div>
      </div>
    </div>
  );
};
