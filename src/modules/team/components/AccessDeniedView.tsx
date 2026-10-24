import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface AccessDeniedViewProps {
  onBackToDashboard?: () => void;
}

export const AccessDeniedView = ({ onBackToDashboard }: AccessDeniedViewProps) => {
  return (
    <div className="p-6 lg:p-12 max-w-2xl mx-auto flex flex-col justify-center min-h-[75vh] animate-in fade-in duration-200">
      <div className="rounded-2xl bg-white dark:bg-[#121215] border border-rose-200 dark:border-rose-500/20 p-8 md:p-10 shadow-xl relative overflow-hidden text-center text-slate-800 dark:text-zinc-100">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-5 shadow-xs">
          <ShieldAlert className="w-7 h-7" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-[10px] font-mono text-rose-700 dark:text-rose-300 uppercase tracking-wider mb-3">
          <span>Acceso Restringido</span>
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Privilegios Insuficientes
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-2 leading-relaxed max-w-md mx-auto">
          El módulo de <span className="text-slate-800 dark:text-zinc-200 font-semibold">Administración de Equipo y Coordinadores</span> está reservado exclusivamente para usuarios con rol <span className="text-blue-600 dark:text-blue-400 font-mono font-semibold">Admin</span>. Su cuenta actual está configurada con rol operativo.
        </p>

        <div className="mt-8 flex justify-center">
          {onBackToDashboard && (
            <button
              type="button"
              onClick={onBackToDashboard}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-[#18181b] hover:dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] text-xs font-semibold text-slate-700 dark:text-zinc-200 flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
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
