import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface AccessDeniedViewProps {
  onBackToDashboard?: () => void;
}

export const AccessDeniedView = ({ onBackToDashboard }: AccessDeniedViewProps) => {
  return (
    <div className="p-6 lg:p-12 max-w-2xl mx-auto flex flex-col justify-center min-h-[80vh] animate-in fade-in duration-200">
      <div className="rounded-2xl bg-[#0F172A]/80 backdrop-blur-xl border border-rose-900/50 p-8 md:p-10 shadow-2xl relative overflow-hidden text-center">
        {/* Línea de realce superior roja */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/50 to-transparent" />

        <div className="mx-auto h-14 w-14 rounded-2xl bg-rose-950/40 border border-rose-800/50 flex items-center justify-center text-rose-400 mb-5 shadow-lg">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-800/40 text-[10px] font-mono text-rose-300 uppercase tracking-wider mb-3">
          <span>Acceso Restringido</span>
        </div>

        <h2 className="text-xl font-semibold text-slate-100">
          Privilegios Insuficientes
        </h2>

        <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-md mx-auto">
          El módulo de <span className="text-slate-200 font-semibold">Administración de Equipo y Coordinadores</span> está reservado exclusivamente para usuarios con rol <span className="text-[#E5B869] font-mono font-semibold">Admin</span>. Su cuenta actual está configurada con rol operativo.
        </p>

        <div className="mt-8 flex justify-center">
          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Regresar al Dashboard</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
