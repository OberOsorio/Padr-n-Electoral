import React from 'react';
import { Server, UserCheck as UsersCheck, ShieldCheck } from 'lucide-react';

export const SecurityMetricsSection: React.FC = () => {
  return (
    <section className="w-full max-w-5xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Disponibilidad Edge */}
        <div className="relative group bg-slate-900/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-950/20 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-105 transition-transform">
              <Server className="w-5 h-5" />
            </div>
            <span className="text-3xl font-extrabold font-mono text-white tracking-tight">
              99.9%
            </span>
          </div>
          <h4 className="text-sm font-semibold text-slate-200">
            Disponibilidad Edge
          </h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Infraestructura distribuida con alta velocidad de respuesta y resiliencia en terreno.
          </p>
        </div>

        {/* Card 2: Cero Duplicados */}
        <div className="relative group bg-slate-900/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-800/80 hover:border-blue-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/20 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 group-hover:scale-105 transition-transform">
              <UsersCheck className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              Cero Duplicados
            </span>
          </div>
          <h4 className="text-sm font-semibold text-slate-200">
            Integridad de Censo
          </h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Reglas anti-colisión en tiempo real a nivel de motor de datos y padrón electoral.
          </p>
        </div>

        {/* Card 3: Cifrado RLS */}
        <div className="relative group bg-slate-900/80 dark:bg-slate-900/60 backdrop-blur-md border border-slate-800/80 hover:border-amber-500/40 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-amber-950/20 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">
              Cifrado RLS
            </span>
          </div>
          <h4 className="text-sm font-semibold text-slate-200">
            Base de Datos Segura
          </h4>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Aislamiento criptográfico estricto por campaña, credenciales protegidas y auditoría continua.
          </p>
        </div>

      </div>
    </section>
  );
};
