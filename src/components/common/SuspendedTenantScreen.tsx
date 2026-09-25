import React from 'react';
import { ShieldAlert, LogOut, Mail, HelpCircle, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SuspendedTenantScreenProps {
  tenantName?: string;
  onSignOut?: () => void;
}

export const SuspendedTenantScreen: React.FC<SuspendedTenantScreenProps> = ({
  tenantName = 'Su Campaña Electoral',
  onSignOut,
}) => {
  const handleSignOut = async () => {
    if (onSignOut) {
      onSignOut();
    } else {
      await supabase.auth.signOut();
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-rose-500/30 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Shield Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-6 shadow-lg shadow-rose-950/40">
          <ShieldAlert className="h-8 w-8" />
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Acceso a Campaña Suspendido
        </h1>

        <p className="text-xs sm:text-sm text-slate-400 mt-3 leading-relaxed">
          El acceso a la organización <strong className="text-rose-300 font-semibold">{tenantName}</strong> ha sido inhabilitado temporalmente por administración de plataforma o vencimiento de la cuota contratada.
        </p>

        {/* Notice box */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-left space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <HelpCircle className="h-4 w-4 text-purple-400 shrink-0" />
            <span>¿Cómo restablecer el servicio?</span>
          </div>
          <p className="text-xs text-slate-400 leading-normal">
            Comuníquese con el Administrador de Plataforma o la mesa de soporte para verificar el estado de la suscripción y renovar su cupo electoral.
          </p>
          <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-xs font-mono text-purple-300">
            <Mail className="h-3.5 w-3.5 text-purple-400" />
            <span>soporte@saas.gov</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-bold text-xs uppercase tracking-wider transition-all border border-slate-700 hover:border-slate-600 shadow-md cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-rose-400" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

        {/* System identity footer */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-mono">
          <Layers className="h-3.5 w-3.5 text-slate-600" />
          <span>SaaS Master Security Shield</span>
        </div>
      </div>
    </div>
  );
};
