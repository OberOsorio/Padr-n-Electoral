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

  const isSandbox = currentTenant.id === 'sandbox';
  const canSwitch = isSuperAdmin && !isSandbox;

  return (
    <div ref={dropdownRef} className={`relative flex items-center gap-2 min-w-0 select-none ${className}`}>
      {/* Botón o Badge del Tenant */}
      {canSwitch ? (
        /* Selector interactivo para SuperAdmin (cuando esté en un tenant específico) */
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 min-h-[40px] rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] border border-slate-200/90 dark:border-white/[0.08] shadow-xs transition-all active:scale-[0.98] cursor-pointer min-w-0 max-w-full"
          title="Cambiar espacio de campaña activo"
        >
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-600/10 dark:bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2} />
          </div>
          <div className="text-left min-w-0">
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight block leading-tight max-w-[145px] xs:max-w-[175px] sm:max-w-[240px] truncate">
              {currentTenant.name}
            </span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 dark:text-zinc-400 shrink-0 ml-0.5 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-500 dark:text-blue-400' : ''
            }`}
          />
        </button>
      ) : (
        /* Badge informativo (Sandbox o rol estándar sin exponer otras campañas) */
        <div className="flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 min-h-[40px] rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/90 dark:border-white/[0.08] shadow-xs min-w-0 max-w-full">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-600/10 dark:bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
            <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2} />
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight max-w-[155px] xs:max-w-[185px] sm:max-w-[240px] truncate">
            {currentTenant.name}
          </span>
        </div>
      )}

      {/* Menú Dropdown para SuperAdmin si está habilitado */}
      {isOpen && canSwitch && (
        <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white/95 dark:bg-[#18181b]/95 backdrop-blur-xl border border-slate-200 dark:border-white/[0.08] shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-zinc-400">
            <span>Cambiar Campaña en Foco</span>
            <span>{tenants.length} registradas</span>
          </div>

          <div className="max-h-60 overflow-y-auto py-1 space-y-1 custom-scrollbar">
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
                      ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300'
                      : 'hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-700 dark:text-zinc-300'
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
