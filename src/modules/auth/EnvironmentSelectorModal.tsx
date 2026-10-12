import React from 'react';
import { 
  ShieldCheck, 
  Building2, 
  Users, 
  ArrowRight, 
  LogOut, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface EnvironmentSelectorProps {
  userEmail?: string;
  adminEmail?: string;
  isOpen?: boolean;
  onSelectMaster: () => void;
  onSelectDemo?: () => void;
  onSelectCampaign?: (tenantId: string | null) => void;
  onSelectOwnerLeader: () => void;
  onLogout?: () => void;
  onSignOut?: () => void;
  tenants?: Array<{ id: string; name: string; slug?: string; plan?: string; is_active?: boolean }>;
  currentTenantId?: string | null;
}

export const EnvironmentSelectorModal: React.FC<EnvironmentSelectorProps> = ({
  userEmail,
  adminEmail,
  isOpen = true,
  onSelectMaster,
  onSelectDemo,
  onSelectCampaign,
  onSelectOwnerLeader,
  onLogout,
  onSignOut,
}) => {
  if (!isOpen) return null;

  const emailDisplay = userEmail || adminEmail || 'oberosorio1@gmail.com';
  const handleDemo = () => {
    if (onSelectDemo) {
      onSelectDemo();
    } else if (onSelectCampaign) {
      onSelectCampaign('sandbox');
    }
  };
  const handleLogout = onLogout || onSignOut || (() => {});

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 min-h-screen w-full flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-5xl bg-white dark:bg-[#070b14] border border-slate-200 dark:border-[#162345] rounded-[36px] shadow-2xl p-6 sm:p-10 relative text-slate-800 dark:text-slate-100 transition-all my-auto"
        >
          {/* Badge Superior */}
          <div className="flex justify-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse"/>
              <span>ACCESO PROPIETARIO DEL SISTEMA</span>
            </div>
          </div>

          {/* Título Principal */}
          <div className="text-center max-w-xl mx-auto mb-10">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Seleccione el Entorno de Operación
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Acceso verificado para <strong className="text-purple-600 dark:text-purple-400 font-mono">{emailDisplay}</strong>. Elija a qué módulo desea dirigirse:
            </p>
          </div>

          {/* Grid de 3 Entornos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            
            {/* 1. MASTER PLATFORM CONTROL */}
            <div className="flex flex-col justify-between p-6 rounded-3xl border border-slate-200 dark:border-[#162345] bg-slate-50/50 dark:bg-[#0b1328]/60 hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/5 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-600/25 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6"/>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    MASTER SAAS
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  Master Platform Control
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Gestión global de campañas, estado de servidores, auditoría y control de infraestructura SaaS.
                </p>
              </div>
              <button
                type="button"
                onClick={onSelectMaster}
                className="w-full pt-4 border-t border-slate-200 dark:border-[#162345] flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:text-purple-500 transition-colors cursor-pointer"
              >
                <span>Ingresar al Panel Maestro</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
              </button>
            </div>

            {/* 2. PORTAL DE LÍDER (MODO PROPIETARIO / SIN CAMPAÑA) */}
            <div className="flex flex-col justify-between p-6 rounded-3xl border border-slate-200 dark:border-[#162345] bg-slate-50/50 dark:bg-[#0b1328]/60 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/5 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Users className="w-6 h-6"/>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    LÍDER PROPIETARIO
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  Portal de Líder en Campo
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Vista de líder operativo con privilegios de dueño, permitiendo probar registro de electores y métricas sin vincularse a campañas.
                </p>
                
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500"/>
                  <span>Entorno independiente (Sin asociar campañas)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onSelectOwnerLeader}
                className="w-full pt-4 border-t border-slate-200 dark:border-[#162345] flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 transition-colors cursor-pointer"
              >
                <span>Ingresar como Líder</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
              </button>
            </div>

            {/* 3. ENTORNO DE DEMOSTRACIÓN (SANDBOX) */}
            <div className="flex flex-col justify-between p-6 rounded-3xl border border-slate-200 dark:border-[#162345] bg-slate-50/50 dark:bg-[#0b1328]/60 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/25 text-blue-600 dark:text-sky-400 flex items-center justify-center">
                    <Building2 className="w-6 h-6"/>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    SANDBOX DEMO
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  Entorno de Demostración
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Supervisión de diseño, interfaz directiva, flujos de líderes y verificación funcional (Zero-Knowledge).
                </p>

                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 text-[11px] text-blue-700 dark:text-sky-300 flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-blue-500"/>
                  <span>Sandbox Limpio Aislado</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDemo}
                className="w-full pt-4 border-t border-slate-200 dark:border-[#162345] flex items-center justify-between text-xs font-bold text-blue-600 dark:text-sky-400 group-hover:text-blue-500 transition-colors cursor-pointer"
              >
                <span>Ingresar a Inspección</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
              </button>
            </div>

          </div>

          {/* Footer: Cerrar Sesión */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4"/>
              <span>Cerrar sesión de propietario</span>
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
