import React from 'react';
import { Sparkles, Crown, Building2, MapPin, Users, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export type DemoRoleType = 'superadmin' | 'admin' | 'coordinador' | 'lider' | 'suspended';

interface DemoAccountsSelectorProps {
  currentEmail: string;
  onSelectAccount: (role: DemoRoleType) => void;
}

interface AccountConfig {
  id: DemoRoleType;
  title: string;
  subtitle: string;
  email: string;
  icon: React.ElementType;
  hoverGlow: string;
  activeBorder: string;
  activeShadow: string;
  iconActive: string;
  iconResting: string;
}

export const DemoAccountsSelector: React.FC<DemoAccountsSelectorProps> = ({
  currentEmail,
  onSelectAccount,
}) => {
  const accounts: AccountConfig[] = [
    {
      id: 'superadmin',
      title: 'SuperAdmin',
      subtitle: 'SaaS Global',
      email: 'superadmin@saas.gov',
      icon: Crown,
      hoverGlow: 'hover:border-purple-400 dark:hover:border-purple-500/40 hover:shadow-[0_0_15px_-3px_rgba(168,85,247,0.15)]',
      activeBorder: 'border-purple-500/60 dark:border-purple-500/60 ring-1 ring-purple-500/30',
      activeShadow: 'shadow-[0_0_15px_-3px_rgba(168,85,247,0.25)]',
      iconActive: 'bg-purple-500/20 text-purple-600 dark:text-purple-300 shadow-xs',
      iconResting: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    },
    {
      id: 'admin',
      title: 'Director',
      subtitle: 'Admin Campaña',
      email: 'admin@alcaldia2027.gov',
      icon: Building2,
      hoverGlow: 'hover:border-blue-400 dark:hover:border-blue-500/40 hover:shadow-[0_0_15px_-3px_rgba(59,130,246,0.15)]',
      activeBorder: 'border-blue-500/60 dark:border-blue-500/60 ring-1 ring-blue-500/30',
      activeShadow: 'shadow-[0_0_15px_-3px_rgba(59,130,246,0.25)]',
      iconActive: 'bg-blue-500/20 text-blue-600 dark:text-blue-300 shadow-xs',
      iconResting: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    },
    {
      id: 'coordinador',
      title: 'Coordinador',
      subtitle: 'Puesto / Zona',
      email: 'coordinador@alcaldia2027.gov',
      icon: MapPin,
      hoverGlow: 'hover:border-indigo-400 dark:hover:border-indigo-500/40 hover:shadow-[0_0_15px_-3px_rgba(99,102,241,0.15)]',
      activeBorder: 'border-indigo-500/60 dark:border-indigo-500/60 ring-1 ring-indigo-500/30',
      activeShadow: 'shadow-[0_0_15px_-3px_rgba(99,102,241,0.25)]',
      iconActive: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 shadow-xs',
      iconResting: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    },
    {
      id: 'lider',
      title: 'Líder',
      subtitle: 'Voto en Campo',
      email: 'lider@alcaldia2027.gov',
      icon: Users,
      hoverGlow: 'hover:border-emerald-400 dark:hover:border-emerald-500/40 hover:shadow-[0_0_15px_-3px_rgba(16,185,129,0.15)]',
      activeBorder: 'border-emerald-500/60 dark:border-emerald-500/60 ring-1 ring-emerald-500/30',
      activeShadow: 'shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)]',
      iconActive: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 shadow-xs',
      iconResting: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    },
  ];

  const isSuspendedActive = currentEmail === 'admin@caucaunido.org';

  return (
    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/60">
      {/* Encabezado Cuentas Demo */}
      <div className="flex items-center justify-between mb-3 px-0.5">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400">
            Cuentas Demo
          </span>
        </div>
        <span className="text-[10px] font-mono font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/60 px-2 py-0.5 rounded-full">
          Multi-Tenant
        </span>
      </div>

      {/* Grid de 4 Cuentas Demo */}
      <div className="grid grid-cols-2 gap-2">
        {accounts.map((acc) => {
          const Icon = acc.icon;
          const isSelected =
            currentEmail === acc.email ||
            (acc.id === 'admin' && currentEmail === 'admin@electoral.gov');

          return (
            <motion.button
              key={acc.id}
              type="button"
              onClick={() => onSelectAccount(acc.id)}
              whileTap={{ scale: 0.98 }}
              className={`w-full group rounded-xl p-3 flex items-center gap-3 text-left transition-all duration-200 cursor-pointer ${
                isSelected
                  ? `bg-slate-100/90 dark:bg-slate-800/90 ${acc.activeBorder} ${acc.activeShadow}`
                  : `bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5 ${acc.hoverGlow}`
              }`}
            >
              {/* Icono de Rol con Iluminación de Acento */}
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? acc.iconActive : acc.iconResting
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>

              {/* Título y Subtítulo */}
              <div className="min-w-0 flex-1">
                <p
                  className={`text-xs font-semibold truncate transition-colors ${
                    isSelected
                      ? 'text-slate-900 dark:text-white font-bold'
                      : 'text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'
                  }`}
                >
                  {acc.title}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate mt-0.5">
                  {acc.subtitle}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Botón Inferior: Probar Cuenta Suspendida */}
      <motion.button
        type="button"
        onClick={() => onSelectAccount('suspended')}
        whileTap={{ scale: 0.99 }}
        className={`mt-2.5 w-full py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs transition-all duration-150 cursor-pointer ${
          isSuspendedActive
            ? 'bg-red-500/15 border-red-500/50 text-red-700 dark:text-red-200 ring-1 ring-red-500/40 shadow-[0_0_15px_-3px_rgba(239,68,68,0.2)] font-semibold'
            : 'border-red-500/20 bg-red-50/60 dark:bg-red-950/20 text-red-700 dark:text-red-300 hover:bg-red-100/70 dark:hover:bg-red-500/15 hover:border-red-500/40 dark:hover:border-red-500/40 hover:text-red-800 dark:hover:text-red-200'
        }`}
      >
        <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />
        <span className="font-medium">Probar Cuenta Suspendida (Test Inactividad)</span>
      </motion.button>
    </div>
  );
};
