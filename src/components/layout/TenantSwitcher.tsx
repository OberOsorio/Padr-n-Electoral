import React from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';

interface TenantSwitcherProps {
  userRole?: string;
  className?: string;
}

export const TenantSwitcher: React.FC<TenantSwitcherProps> = ({ userRole, className = '' }) => {
  const { currentTenant, tenants, currentTenantId, setCurrentTenantId } = useTenant();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const isSuperAdmin = userRole?.toLowerCase() === 'superadmin';

  // Cerrar al hacer clic fuera
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentTenant) return null;

  return (
    <div ref={dropdownRef} className={`relative flex items-center gap-2 select-none ${className}`}>
      {/* Botón o Badge del Tenant */}
      {isSuperAdmin ? (
        /* Selector interactivo para SuperAdmin */
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/60 shadow-xs text-xs transition-all cursor-pointer"
          title="Cambiar espacio de campaña activo (SuperAdmin)"
        >
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-semibold text-[10px] shadow-xs">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-left">
            <span className="font-semibold text-slate-900 dark:text-white block leading-tight max-w-[130px] sm:max-w-[180px] truncate">
              {currentTenant.name}
            </span>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      ) : (
        /* Badge informativo para Admin / Coordinador */
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
          <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="font-semibold text-slate-800 dark:text-slate-200 max-w-[160px] truncate">
            {currentTenant.name}
          </span>
        </div>
      )}

      {/* Menú Dropdown para SuperAdmin */}
      {isOpen && isSuperAdmin && (
        <div className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-white/95 dark:bg-[#111827]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
            <span>Cambiar Campaña en Foco</span>
            <span>{tenants.length} registradas</span>
          </div>

          <div className="max-h-60 overflow-y-auto py-1 space-y-1">
            {tenants.map((t) => {
              const isSelected = t.id === currentTenantId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setCurrentTenantId(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold truncate">{t.name}</p>
                    <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                      {t.slug} • Plan {t.plan}
                    </p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
