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
    <div ref={dropdownRef} className={`relative flex items-center gap-2 min-w-0 select-none ${className}`}>
      {/* Botón o Badge del Tenant */}
      {isSuperAdmin ? (
        /* Selector interactivo para SuperAdmin */
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 min-h-[44px] rounded-2xl bg-slate-50/95 hover:bg-slate-100 dark:bg-[#0c162b]/90 dark:hover:bg-[#111e3b] border border-slate-200/90 dark:border-[#1d2d52] shadow-sm transition-all active:scale-[0.98] cursor-pointer min-w-0 max-w-full"
          title="Cambiar espacio de campaña activo (SuperAdmin)"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-600/15 dark:bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-sky-400 shrink-0 shadow-xs">
            <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
          </div>
          <div className="text-left min-w-0">
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-wide block leading-tight max-w-[145px] xs:max-w-[175px] sm:max-w-[240px] truncate">
              {currentTenant.name}
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 dark:text-slate-400 shrink-0 ml-0.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-500 dark:text-sky-400' : ''
            }`}
          />
        </button>
      ) : (
        /* Badge informativo para Admin / Coordinador */
        <div className="flex items-center gap-2.5 px-3.5 py-2 sm:px-4 sm:py-2.5 min-h-[44px] rounded-2xl bg-slate-50/95 dark:bg-[#0c162b]/90 border border-slate-200/90 dark:border-[#1d2d52] shadow-sm min-w-0 max-w-full">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-600/15 dark:bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-sky-400 shrink-0 shadow-xs">
            <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" strokeWidth={2.2} />
          </div>
          <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-wide max-w-[155px] xs:max-w-[185px] sm:max-w-[240px] truncate">
            {currentTenant.name}
          </span>
        </div>
      )}

      {/* Menú Dropdown para SuperAdmin */}
      {isOpen && isSuperAdmin && (
        <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white/95 dark:bg-[#0b1328]/95 backdrop-blur-xl border border-slate-200 dark:border-[#1d2d52] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
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
