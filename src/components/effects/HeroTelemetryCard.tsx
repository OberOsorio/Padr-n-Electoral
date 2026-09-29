import React from 'react';
import { Activity, ShieldCheck, Zap, Database, CheckCircle2, Radio, Server } from 'lucide-react';

export const HeroTelemetryCard: React.FC = () => {
  return (
    <div className="relative w-full max-w-[460px] mx-auto">
      {/* Resplandor ambiental estático y ultra-ligero (sin animación JS) */}
      <div
        className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 blur-xl opacity-70 pointer-events-none -z-10"
        aria-hidden="true"
      />

      {/* Tarjeta Ejecutiva de Telemetría */}
      <div className="rounded-2xl bg-white/90 dark:bg-[#111A2E]/90 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xl backdrop-blur-xl text-left select-none transition-all">
        {/* Encabezado con estado en vivo */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold tracking-wider uppercase text-slate-800 dark:text-slate-200 font-mono flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-500" />
              Centro de Mando Operativo
            </span>
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
            <Server className="w-3 h-3 text-blue-500" />
            Zero-Lag
          </span>
        </div>

        {/* Cuadrícula de Métricas Clave */}
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80">
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-500" />
              Latencia
            </div>
            <div className="text-base sm:text-lg font-extrabold font-mono text-slate-900 dark:text-white">
              0.08<span className="text-xs font-normal text-slate-400 dark:text-slate-500">s</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80">
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Integridad
            </div>
            <div className="text-base sm:text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              100%
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800/80">
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Database className="w-3 h-3 text-blue-500" />
              Censo
            </div>
            <div className="text-base sm:text-lg font-extrabold font-mono text-blue-600 dark:text-blue-400">
              En Vivo
            </div>
          </div>
        </div>

        {/* Flujo de Actividad y Protocolos de Seguridad */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-medium">Validación Cédula DNP/Censo</span>
            </div>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
              AUTOCORRECT
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="font-medium">Motor Anti-Colisión Territorial</span>
            </div>
            <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-semibold">
              BLINDADO
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/80 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Activity className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="font-medium">Sincronización WebSocket</span>
            </div>
            <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
              REALTIME
            </span>
          </div>
        </div>

        {/* Barra inferior de estado */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          <span>Render GPU: 0% (CSS Puro)</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">99.99% SLA</span>
        </div>
      </div>
    </div>
  );
};
