import React, { useState } from 'react';
import {
  ShieldCheck,
  Building2,
  LogOut,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SuperAdminGatewayModalProps {
  isOpen: boolean;
  onSelectMaster: () => void;
  onSelectCampaign: (tenantId: string | null) => void;
  onSignOut: () => void;
  tenants: Array<{ id: string; name: string; slug?: string; plan?: string; is_active?: boolean }>;
  currentTenantId?: string | null;
  adminEmail?: string;
}

export const SuperAdminGatewayModal: React.FC<SuperAdminGatewayModalProps> = ({
  isOpen,
  onSelectMaster,
  onSelectCampaign,
  onSignOut,
  tenants = [],
  currentTenantId = null,
  adminEmail = 'oberosorio1@gmail.com',
}) => {
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    currentTenantId || (tenants.length > 0 ? tenants[0].id : '')
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 14 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 14 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#0c111d] border border-slate-200 dark:border-purple-900/40 rounded-3xl shadow-2xl shadow-purple-950/30 overflow-hidden my-auto"
        >
          {/* Luz ambiental sutil superior */}
          <div
            className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-purple-500/10 via-purple-500/5 to-transparent pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative p-6 sm:p-8 md:p-10 flex flex-col items-center text-center">
            {/* 1. Header con Badge de Propietario */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/25 shadow-[0_0_20px_rgba(168,85,247,0.18)] mb-4">
              <Sparkles className="w-3.5 h-3.5 text-purple-500 animate-pulse" />
              <span className="text-[11px] font-mono font-bold tracking-widest uppercase">
                Acceso Propietario del Sistema
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
              Seleccione el Entorno de Operación
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-lg mb-8 leading-relaxed">
              Acceso verificado para <span className="font-semibold text-purple-600 dark:text-purple-400">{adminEmail}</span>.
              Elija a qué módulo desea dirigirse:
            </p>

            {/* 2. Tarjetas de Selección de Entorno */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8 text-left">
              {/* Opción 1: Master Platform Control (SuperAdmin) */}
              <div
                onClick={onSelectMaster}
                className="group relative flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-b from-purple-50/50 to-white dark:from-purple-950/20 dark:to-slate-900/60 border border-purple-200/80 dark:border-purple-800/40 hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-200 cursor-pointer hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 group-hover:scale-105 transition-transform duration-200">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700/50">
                      Master SaaS
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Master Platform Control
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Gestión global de campañas, estado de servidores, auditoría y control de infraestructura SaaS.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-purple-100 dark:border-purple-900/30 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                  <span>Ingresar al Panel Maestro</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Opción 2: Entorno Operativo de Campaña (Aspirante / Admin) */}
              <div className="group relative flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-b from-blue-50/50 to-white dark:from-blue-950/20 dark:to-slate-900/60 border border-blue-200/80 dark:border-blue-800/40 hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-0.5">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 group-hover:scale-105 transition-transform duration-200">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700/50">
                      Inspección UI
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Entorno de Campaña
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    Supervisión de diseño, interfaz directiva, flujos de líderes y verificación funcional (Zero-Knowledge).
                  </p>

                  {/* Selector contextual de campaña */}
                  <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-blue-500" />
                      Campaña a Previsualizar:
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTenantId}
                        onChange={(e) => setSelectedTenantId(e.target.value)}
                        className="w-full text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2 pl-3 pr-8 text-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 appearance-none cursor-pointer"
                      >
                        <option value="">Sandbox Limpio / General</option>
                        {tenants.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.plan ? t.plan.toUpperCase() : 'ESTÁNDAR'})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-blue-100 dark:border-blue-900/30">
                  <button
                    type="button"
                    onClick={() => onSelectCampaign(selectedTenantId || null)}
                    className="w-full flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer"
                  >
                    <span>Ingresar a Inspección</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Botón Inferior de Cierre de Sesión */}
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors py-2 px-4 rounded-xl hover:bg-red-50/50 dark:hover:bg-red-950/20 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión de propietario</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
