import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Database,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Search,
  Lock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import type { TenantPlan } from '../../types';

interface SuperAdminDashboardProps {
  onSwitchToTenantWorkspace?: (tenantId: string) => void;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  onSwitchToTenantWorkspace,
}) => {
  const {
    tenants,
    currentTenantId,
    setCurrentTenantId,
    createTenant,
    toggleTenantStatus,
  } = useTenant();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Formulario nuevo tenant
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formPlan, setFormPlan] = useState<TenantPlan>('pro');
  const [formMaxElectors, setFormMaxElectors] = useState<number>(25000);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Auto-generar slug al escribir el nombre
  const handleNameChange = (name: string) => {
    setFormName(name);
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setFormSlug(slug);
  };

  const handlePlanChange = (plan: TenantPlan) => {
    setFormPlan(plan);
    if (plan === 'standard') setFormMaxElectors(10000);
    if (plan === 'pro') setFormMaxElectors(25000);
    if (plan === 'enterprise') setFormMaxElectors(100000);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || !formSlug.trim()) {
      setFormError('El nombre y el identificador de URL (slug) son obligatorios.');
      return;
    }

    if (tenants.some((t) => t.slug === formSlug.trim())) {
      setFormError('Ya existe una campaña con este slug. Elija uno diferente.');
      return;
    }

    setFormSubmitting(true);
    try {
      await createTenant({
        name: formName.trim(),
        slug: formSlug.trim(),
        plan: formPlan,
        max_electors: Number(formMaxElectors) || 10000,
      });

      // Limpiar formulario y cerrar
      setFormName('');
      setFormSlug('');
      setFormPlan('pro');
      setFormMaxElectors(25000);
      setIsCreateModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Error al crear la campaña.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filtrado de tenants
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = selectedPlanFilter === 'all' || tenant.plan === selectedPlanFilter;
    return matchesSearch && matchesPlan;
  });

  // Métricas Globales
  const totalTenants = tenants.length;
  const activeTenantsCount = tenants.filter((t) => t.is_active).length;
  const suspendedTenantsCount = totalTenants - activeTenantsCount;
  const totalCapacityElectors = tenants.reduce((acc, t) => acc + (t.max_electors || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto space-y-6 sm:space-y-8 pb-24 md:pb-10 animate-in fade-in duration-300">
      
      {/* 1. Header del Panel Maestro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-700/60 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-[10px] font-mono text-indigo-700 dark:text-indigo-400 font-semibold tracking-wider uppercase mb-2">
            <Lock className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>Mando Global · SuperAdmin SaaS</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span>Gestión de Campañas & Organizaciones</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 mt-1">
            Aprovisionamiento de tenants, cuotas censales y control de aislamiento multi-inquilino.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nueva Campaña</span>
        </button>
      </div>

      {/* 2. KPIs Globales de la Plataforma */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        
        {/* KPI 1: Total Campañas */}
        <div className="rounded-2xl bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 p-5 shadow-xs dark:shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Campañas Registradas
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-3xl font-semibold text-slate-900 dark:text-white font-mono">
              {totalTenants}
            </span>
          </div>
          <p className="mt-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{activeTenantsCount} activas</span>
            {suspendedTenantsCount > 0 && (
              <span className="text-rose-500 font-mono">• {suspendedTenantsCount} suspendidas</span>
            )}
          </p>
        </div>

        {/* KPI 2: Capacidad Censal Contratada */}
        <div className="rounded-2xl bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 p-5 shadow-xs dark:shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Capacidad Asignada
            </span>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-3xl font-semibold text-slate-900 dark:text-white font-mono">
              {totalCapacityElectors.toLocaleString('es-CO')}
            </span>
          </div>
          <p className="mt-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            Electores autorizados en cuotas
          </p>
        </div>

        {/* KPI 3: Distribución Enterprise & Pro */}
        <div className="rounded-2xl bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 p-5 shadow-xs dark:shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Planes Avanzados
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-[#E5B869]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-3xl font-semibold text-amber-600 dark:text-[#E5B869] font-mono">
              {tenants.filter((t) => t.plan === 'enterprise' || t.plan === 'pro').length}
            </span>
          </div>
          <p className="mt-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            Nivel Pro / Enterprise
          </p>
        </div>

        {/* KPI 4: Aislamiento RLS */}
        <div className="rounded-2xl bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 p-5 shadow-xs dark:shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Seguridad Multi-Tenant
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
              100% Blindado
            </span>
          </div>
          <p className="mt-2 text-xs font-mono text-slate-500 dark:text-slate-400">
            Políticas RLS en Supabase
          </p>
        </div>
      </div>

      {/* 3. Tabla Principal de Campañas */}
      <div className="rounded-2xl bg-white dark:bg-slate-800/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 shadow-xs dark:shadow-xl overflow-hidden">
        
        {/* Barra de Filtros */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por campaña o slug..."
              className="w-full h-9.5 pl-10 pr-3.5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedPlanFilter}
              onChange={(e) => setSelectedPlanFilter(e.target.value)}
              className="h-9.5 px-3 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="all">Todos los Planes</option>
              <option value="standard">Standard (10K)</option>
              <option value="pro">Pro (25K)</option>
              <option value="enterprise">Enterprise (100K)</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700/60 text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none">
              <tr>
                <th className="py-3 px-4">Campaña / Organización</th>
                <th className="py-3 px-4">Slug Identificador</th>
                <th className="py-3 px-4">Plan SaaS</th>
                <th className="py-3 px-4">Límite Censal</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acciones de Mando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No se encontraron campañas con los criterios indicados.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => {
                  const isCurrent = tenant.id === currentTenantId;

                  return (
                    <tr
                      key={tenant.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors ${
                        isCurrent ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      {/* Nombre de la Campaña */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-semibold text-xs shadow-sm ring-1 ring-white/10 shrink-0">
                            {tenant.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-white text-xs">
                                {tenant.name}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-mono text-[9px] uppercase font-bold">
                                  En Foco
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                              Creado: {new Date(tenant.created_at).toLocaleDateString('es-CO')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                        <span className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                          {tenant.slug}
                        </span>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                            tenant.plan === 'enterprise'
                              ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                              : tenant.plan === 'pro'
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          {tenant.plan}
                        </span>
                      </td>

                      {/* Límite Censal */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs text-slate-700 dark:text-slate-200">
                          <span className="font-bold">{tenant.max_electors.toLocaleString('es-CO')}</span> electores
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">
                        {tenant.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-[10px] font-mono font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 text-[10px] font-mono font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Suspendida
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Cambiar Foco a este Tenant */}
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentTenantId(tenant.id);
                              onSwitchToTenantWorkspace?.(tenant.id);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Entrar y supervisar este espacio de trabajo"
                          >
                            <span>Supervisar</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          {/* Suspender / Reactivar */}
                          <button
                            type="button"
                            onClick={() => toggleTenantStatus(tenant.id)}
                            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                              tenant.is_active
                                ? 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                                : 'border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                            title={tenant.is_active ? 'Suspender campaña' : 'Reactivar campaña'}
                          >
                            {tenant.is_active ? (
                              <XCircle className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear Nueva Campaña (Tenant) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#161F30] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden p-6 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Building2 className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    Aprovisionar Nueva Campaña
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Crea un espacio de trabajo con base de datos aislada por tenant.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre de la Campaña / Organización *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ej. Campaña Gobernación 2027"
                  className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Identificador Único (Slug URL) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))}
                    placeholder="gobernacion-2027"
                    className="w-full h-10 px-3.5 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  Identificador inmutable para segmentación en base de datos.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Plan Contratado
                  </label>
                  <select
                    value={formPlan}
                    onChange={(e) => handlePlanChange(e.target.value as TenantPlan)}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="standard">Standard (10K electores)</option>
                    <option value="pro">Pro (25K electores)</option>
                    <option value="enterprise">Enterprise (100K electores)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Cuota Máxima Electores
                  </label>
                  <input
                    type="number"
                    value={formMaxElectors}
                    onChange={(e) => setFormMaxElectors(Number(e.target.value))}
                    min={100}
                    step={500}
                    className="w-full h-10 px-3 font-mono bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? 'Aprovisionando...' : 'Crear Campaña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
