import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  CheckCircle2,
  User,
  AlertTriangle,
  Power,
  Loader2,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenant } from '../../context/TenantContext';
import { useAccessAuditLogs } from './useAccessAuditLogs';
import type { Tenant, TenantPlan } from '../../types';

export const TenantsManagementView: React.FC = () => {
  const { tenants, toggleTenantStatus, createCampaignWithAdmin, deleteTenantPermanently, refetchTenants } = useTenant();
  const { recordAccessEvent } = useAccessAuditLogs();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Estado para Modal de Eliminación Definitiva (Security-First UX)
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Formulario de nueva campaña
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [plan, setPlan] = useState<TenantPlan>('pro');
  const [maxElectors, setMaxElectors] = useState<number>(25000);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('Admin2026*');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manejador de Eliminación Crítica Definitiva
  const handleDeleteTenant = async () => {
    if (!tenantToDelete) return;
    if (deleteConfirmationText.trim() !== 'ELIMINAR MI CAMPAÑA') return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteTenantPermanently(tenantToDelete.id);
      if (!res.success) {
        setDeleteError(res.error || 'Ocurrió un error al intentar eliminar la campaña.');
        setIsDeleting(false);
        return;
      }

      recordAccessEvent({
        user_email: 'oberosorio1@gmail.com',
        user_name: 'Ober Osorio (SuperAdmin)',
        user_role: 'superadmin',
        tenant_name: tenantToDelete.name,
        tenant_id: tenantToDelete.id,
        event_type: 'campaign_suspended',
        description: `Campaña "${tenantToDelete.name}" ELIMINADA DEFINITIVAMENTE por el SuperAdmin`,
      });

      setToastMessage(`Campaña "${tenantToDelete.name}" y todos sus datos fueron eliminados de forma definitiva.`);
      setTimeout(() => setToastMessage(null), 5000);
      setTenantToDelete(null);
      setDeleteConfirmationText('');
    } catch (err: any) {
      console.error('Error al eliminar campaña:', err);
      setDeleteError(err.message || 'Error de conexión al eliminar');
    } finally {
      setIsDeleting(false);
    }
  };

  // Auto-generación de slug
  const handleNameChange = (val: string) => {
    setName(val);
    const generated = val
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generated);
  };

  // Filtrado de tenants
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.admin_name && t.admin_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.admin_email && t.admin_email.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'active'
          ? t.is_active
          : !t.is_active;

      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchTerm, statusFilter]);

  // Manejar suspensión / reactivación directa
  const handleToggleStatus = async (tenant: Tenant) => {
    setTogglingId(tenant.id);
    try {
      await toggleTenantStatus(tenant.id);
      const newStatus = !tenant.is_active;

      recordAccessEvent({
        user_email: 'superadmin@saas.gov',
        user_name: 'SuperAdmin Maestro',
        user_role: 'superadmin',
        tenant_name: tenant.name,
        tenant_id: tenant.id,
        event_type: newStatus ? 'campaign_activated' : 'campaign_suspended',
        description: `Campaña ${tenant.name} ${newStatus ? 'activada' : 'suspendida'} por el SuperAdmin`,
      });

      setToastMessage(
        newStatus
          ? `Campaña "${tenant.name}" activada. Los usuarios pueden operar normalmente.`
          : `Campaña "${tenant.name}" suspendida. Se ha bloqueado el acceso a sus operadores.`
      );
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Error al alternar estado:', err);
    } finally {
      setTogglingId(null);
    }
  };

  // Guardar nueva campaña con su administrador
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('El nombre comercial de la campaña es obligatorio.');
      return;
    }
    if (!adminName.trim() || !adminEmail.trim()) {
      setFormError('Debe definir un Administrador Responsable (Nombre y Correo).');
      return;
    }
    if (maxElectors <= 0) {
      setFormError('El límite de electores debe ser mayor a 0.');
      return;
    }

    setSubmitting(true);

    try {
      const created = await createCampaignWithAdmin({
        name: name.trim(),
        slug: slug.trim() || `campana-${Date.now()}`,
        plan,
        max_electors: Number(maxElectors),
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim().toLowerCase(),
        adminPassword,
      });

      recordAccessEvent({
        user_email: 'superadmin@saas.gov',
        user_name: 'SuperAdmin Maestro',
        user_role: 'superadmin',
        tenant_name: created.name,
        tenant_id: created.id,
        event_type: 'tenant_created',
        description: `Aprovisionada nueva campaña ${created.name} con Admin ${adminEmail}`,
      });

      setToastMessage(`Campaña "${created.name}" creada con éxito.`);
      setTimeout(() => setToastMessage(null), 4000);
      setIsModalOpen(false);

      // Limpiar formulario
      setName('');
      setSlug('');
      setPlan('pro');
      setMaxElectors(25000);
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('Admin2026*');
      refetchTenants();
    } catch (err: any) {
      console.error('Error creando campaña:', err);
      setFormError(err?.message || 'Error al aprovisionar la campaña.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-[#0F172A] text-white border border-purple-500/40 shadow-2xl flex items-center gap-3 text-xs font-medium max-w-md"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Campañas Políticas y Clientes
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Control de cuentas, asignación de directores y suspensión instantánea de servicio
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto justify-center px-4 py-2.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-purple-600/25 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Campaña</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por campaña, slug o administrador..."
            className="w-full h-10 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/40"
          />
        </div>

        <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          {(['all', 'active', 'suspended'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-2 sm:py-1.5 rounded-lg text-xs font-medium font-mono uppercase text-center transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {st === 'all' ? 'Todas' : st === 'active' ? 'Activas' : 'Suspendidas'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Campañas */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Campaña</th>
                <th className="py-3 px-4 font-semibold">Director / Admin</th>
                <th className="py-3 px-4 font-semibold">Plan</th>
                <th className="py-3 px-4 font-semibold">Electores / Límite</th>
                <th className="py-3 px-4 font-semibold">Contratación</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Interruptor Servicio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No se encontraron campañas coincidentes con los filtros.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const current = t.totalElectores || 0;
                  const max = t.max_electors || 10000;
                  const isSuspended = !t.is_active;

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors ${
                        isSuspended ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Campaña */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSuspended
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800'
                              : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                          }`}>
                            {t.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {t.name}
                            </p>
                            <p className="text-[10px] font-mono text-slate-400 truncate">
                              id: {t.slug}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Director / Admin */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {t.admin_name || 'Sin asignar'}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400">
                            {t.admin_email || 'admin@' + t.slug + '.gov'}
                          </p>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          t.plan === 'enterprise'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                            : t.plan === 'pro'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {t.plan}
                        </span>
                      </td>

                      {/* Electores / Límite */}
                      <td className="py-3.5 px-4 font-mono">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {current.toLocaleString()}
                        </span>
                        <span className="text-slate-400"> / {max.toLocaleString()}</span>
                      </td>

                      {/* Fecha de Contratación */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {new Date(t.created_at).toLocaleDateString()}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">
                        {t.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium font-mono bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Suspendida
                          </span>
                        )}
                      </td>

                      {/* Acciones: Suspensión y Eliminación Definitiva */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(t)}
                            disabled={togglingId === t.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                              t.is_active
                                ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50'
                                : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50'
                            } disabled:opacity-50`}
                            title={t.is_active ? 'Suspender acceso a campaña' : 'Reactivar acceso a campaña'}
                          >
                            {togglingId === t.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Power className="w-3.5 h-3.5" />
                            )}
                            <span>{t.is_active ? 'Suspender' : 'Reactivar'}</span>
                          </button>

                          {/* Botón Eliminar Definitivamente (Habilitado solo si la campaña está suspendida) */}
                          <button
                            type="button"
                            onClick={() => {
                              if (!t.is_active) {
                                setTenantToDelete(t);
                                setDeleteConfirmationText('');
                                setDeleteError(null);
                              }
                            }}
                            disabled={t.is_active}
                            className={`p-1.5 rounded-xl border transition-all ${
                              t.is_active
                                ? 'opacity-30 border-transparent text-slate-400 dark:text-slate-600 cursor-not-allowed'
                                : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/30 cursor-pointer'
                            }`}
                            title={
                              t.is_active
                                ? 'Debe suspender la campaña antes de poder eliminarla'
                                : 'Eliminar campaña definitivamente'
                            }
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* MODAL: Crear Nueva Campaña */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 relative overflow-hidden my-auto max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                      Aprovisionar Nueva Campaña
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Crea el tenant aislado y su administrador directo
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
                {/* 1. Nombre Comercial */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase font-semibold text-slate-600 dark:text-slate-400">
                    Nombre Comercial de la Campaña *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ej. Campaña Montería 2026"
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* 2. Slug & Plan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase font-semibold text-slate-600 dark:text-slate-400">
                      Identificador (Slug)
                    </label>
                    <input
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="monteria-2026"
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase font-semibold text-slate-600 dark:text-slate-400">
                      Plan SaaS
                    </label>
                    <select
                      value={plan}
                      onChange={(e) => {
                        const p = e.target.value as TenantPlan;
                        setPlan(p);
                        if (p === 'standard') setMaxElectors(10000);
                        if (p === 'pro') setMaxElectors(25000);
                        if (p === 'enterprise') setMaxElectors(100000);
                      }}
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="standard">Standard (10k)</option>
                      <option value="pro">Pro (25k)</option>
                      <option value="enterprise">Enterprise (100k)</option>
                    </select>
                  </div>
                </div>

                {/* 3. Límite de Electores Contratados */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase font-semibold text-slate-600 dark:text-slate-400">
                    Límite Máximo de Electores *
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={maxElectors}
                    onChange={(e) => setMaxElectors(Number(e.target.value))}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* 4. Separador: Datos del Administrador Responsable */}
                <div className="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] font-mono uppercase font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Administrador Responsable de la Campaña</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase font-semibold text-slate-600 dark:text-slate-400">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Dr. Carlos Gómez"
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase font-semibold text-slate-600 dark:text-slate-400">
                      Correo Institucional *
                    </label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@monteria2026.gov"
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase font-semibold text-slate-600 dark:text-slate-400">
                    Contraseña Provisional
                  </label>
                  <input
                    type="text"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    El usuario podrá modificarla tras su primer inicio de sesión.
                  </p>
                </div>

                {/* Acciones */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Aprovisionando...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Aprovisionar Campaña</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Eliminación Definitiva de Campaña (Security-First Destructive Flow) */}
      <AnimatePresence>
        {tenantToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg rounded-2xl bg-slate-900 border border-red-500/30 shadow-2xl shadow-red-950/50 p-6 sm:p-7 relative overflow-hidden my-auto"
            >
              {/* Resplandor decorativo carmesí */}
              <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

              {/* A. Cabecera del Modal (Alerta Crítica) */}
              <div className="flex flex-col items-start gap-2 mb-4">
                <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 shadow-lg shadow-red-500/10 mb-1">
                  <AlertTriangle className="w-7 h-7 text-red-500 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Confirmación de Seguridad Definitiva
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                      Acción Crítica Irreversible
                    </span>
                  </div>
                </div>
              </div>

              {/* B. Texto de Advertencia e Impacto */}
              <div className="space-y-3 mb-5 text-sm">
                <p className="text-slate-300 leading-relaxed">
                  <span className="font-bold text-red-400">¡ATENCIÓN!</span> Está a punto de{' '}
                  <span className="font-semibold text-white">ELIMINAR COMPLETAMENTE</span> la campaña{' '}
                  <span className="font-mono font-bold text-red-300 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900/50">
                    "{tenantToDelete.name}"
                  </span>{' '}
                  y todos sus datos asociados.
                </p>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                    Recursos que serán destruidos permanentemente:
                  </p>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    <li>Todos los electores registrados en el censo de esta campaña</li>
                    <li>Todos los usuarios y perfiles vinculados (excepto SuperAdmin)</li>
                    <li>Todos los registros de auditoría de acceso, logs de exportación y métricas</li>
                  </ul>
                </div>

                <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/30 text-xs font-semibold text-red-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping shrink-0" />
                  <span>Esta acción NO se puede deshacer. Los datos se perderán para siempre.</span>
                </div>
              </div>

              {/* C. Validación de Seguridad por Texto */}
              <div className="space-y-2 mb-6">
                <label className="block text-xs font-medium text-slate-300">
                  Para confirmar, escriba exactamente{' '}
                  <span className="font-mono font-bold text-red-400 select-all bg-red-950/50 px-1.5 py-0.5 rounded border border-red-900/60">
                    ELIMINAR MI CAMPAÑA
                  </span>{' '}
                  a continuación:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  placeholder='Escriba "ELIMINAR MI CAMPAÑA" para confirmar.'
                  disabled={isDeleting}
                  className="w-full bg-slate-950/80 border border-slate-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 font-mono tracking-wide transition-all outline-none"
                  autoFocus
                />

                {deleteError && (
                  <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/50 text-red-400 text-xs">
                    {deleteError}
                  </div>
                )}
              </div>

              {/* D. Botones de Acción (Footer) */}
              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (!isDeleting) {
                      setTenantToDelete(null);
                      setDeleteConfirmationText('');
                      setDeleteError(null);
                    }
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 border border-slate-700/60 transition-all cursor-pointer disabled:opacity-50"
                >
                  CANCELAR OPERACIÓN
                </button>

                <button
                  type="button"
                  onClick={handleDeleteTenant}
                  disabled={deleteConfirmationText.trim() !== 'ELIMINAR MI CAMPAÑA' || isDeleting}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-lg ${
                    deleteConfirmationText.trim() === 'ELIMINAR MI CAMPAÑA' && !isDeleting
                      ? 'bg-red-600 hover:bg-red-500 text-white border border-red-500 shadow-red-600/40 animate-pulse'
                      : 'bg-slate-800/80 text-slate-500 border border-slate-800 cursor-not-allowed opacity-50'
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span className="text-white">Eliminando datos...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>ELIMINAR DEFINITIVAMENTE</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
