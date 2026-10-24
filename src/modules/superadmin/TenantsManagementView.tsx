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
  MapPin,
  Eye,
  EyeOff,
  Copy,
  Check,
  Edit3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTenant } from '../../context/TenantContext';
import { useAccessAuditLogs } from './useAccessAuditLogs';
import { ColombiaGeoSelector } from '../../components/ui/ColombiaGeoSelector';
import { EditCampaignModal } from './EditCampaignModal';
import type { Tenant } from '../../types';

const springTransition = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 30,
  mass: 0.8,
};

export const TenantsManagementView: React.FC = () => {
  const { tenants, toggleTenantStatus, createCampaignWithAdmin, deleteTenantPermanently, refetchTenants, updateTenant } = useTenant();
  const { recordAccessEvent } = useAccessAuditLogs();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Tenant | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Estado para Modal de Eliminación Definitiva (Security-First UX)
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [copiedConfirmation, setCopiedConfirmation] = useState(false);

  // Formulario de nueva campaña (Capacidad Ilimitada)
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    } catch (err: unknown) {
      console.error('Error al eliminar campaña:', err);
      setDeleteError(err instanceof Error ? err.message : 'Error de conexión al eliminar');
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

  // Guardar nueva campaña con su administrador (Modelo Capacidad Ilimitada)
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
    if (!adminPassword || adminPassword.length < 6) {
      setFormError('Debe definir una contraseña para el administrador (mínimo 6 caracteres).');
      return;
    }

    setSubmitting(true);

    try {
      const created = await createCampaignWithAdmin({
        name: name.trim(),
        slug: slug.trim() || `campana-${Date.now()}`,
        departamento: departamento.trim() || undefined,
        municipio: municipio.trim() || undefined,
        adminName: adminName.trim(),
        adminEmail: adminEmail.trim().toLowerCase(),
        adminPassword,
      });

      recordAccessEvent({
        user_email: 'oberosorio1@gmail.com',
        user_name: 'Ober Osorio (SuperAdmin)',
        user_role: 'superadmin',
        tenant_name: created.name,
        tenant_id: created.id,
        event_type: 'tenant_created',
        description: `Aprovisionada nueva campaña ${created.name} (Capacidad Ilimitada) con Admin ${adminEmail}`,
      });

      setToastMessage(`Campaña "${created.name}" aprovisionada con éxito con Capacidad Ilimitada.`);
      setTimeout(() => setToastMessage(null), 4500);
      setIsModalOpen(false);

      // Limpiar formulario
      setName('');
      setSlug('');
      setDepartamento('');
      setMunicipio('');
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
      setShowPassword(false);
      refetchTenants();
    } catch (err: unknown) {
      console.error('Error creando campaña:', err);
      setFormError(err instanceof Error ? err.message : 'Error al aprovisionar la campaña.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-[1600px] mx-auto pb-24 md:pb-12 text-slate-800 dark:text-zinc-100">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={springTransition}
            className="fixed top-5 right-5 z-50 p-4 rounded-2xl bg-white dark:bg-[#18181b] text-slate-900 dark:text-white border border-slate-200 dark:border-white/[0.1] shadow-2xl flex items-center gap-3 text-xs font-medium max-w-md"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-zinc-400 font-semibold">
              Arquitectura Multitenant & Clientes
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Campañas Electorales y Tenants
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
            Control de cuentas aisladas, asignación de directores y suspensión perimetral de servicio.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Campaña</span>
        </button>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por campaña, slug o administrador..."
            className="w-full h-10 pl-10 pr-4 bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          {(['all', 'active', 'suspended'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 sm:py-2 rounded-xl text-xs font-medium font-mono uppercase text-center transition-all cursor-pointer active:scale-[0.98] ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white hover:bg-slate-50 dark:bg-[#121215] dark:hover:bg-[#18181b] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300'
              }`}
            >
              {st === 'all' ? 'Todas' : st === 'active' ? 'Activas' : 'Suspendidas'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Campañas */}
      <div className="rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.07] overflow-hidden shadow-xs dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead className="bg-slate-50 dark:bg-white/[0.02] text-[10px] font-mono uppercase text-slate-500 dark:text-zinc-400 border-b border-slate-200 dark:border-white/[0.07]">
              <tr>
                <th className="py-3 px-4 font-semibold">Campaña</th>
                <th className="py-3 px-4 font-semibold">Director / Admin</th>
                <th className="py-3 px-4 font-semibold">Electores Registrados</th>
                <th className="py-3 px-4 font-semibold">Contratación</th>
                <th className="py-3 px-4 font-semibold">Estado</th>
                <th className="py-3 px-4 font-semibold text-right">Interruptor Servicio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.07] text-slate-700 dark:text-zinc-300">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-zinc-500 font-mono text-xs italic">
                    No se encontraron campañas coincidentes con los filtros.
                  </td>
                </tr>
              ) : (
                filteredTenants.map((t) => {
                  const current = t.totalElectores || 0;
                  const isSuspended = !t.is_active;

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-white/[0.03] transition-colors ${
                        isSuspended ? 'bg-rose-50/20 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Campaña */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold font-mono text-xs shrink-0 border ${
                            isSuspended
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40'
                              : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40'
                          }`}>
                            {t.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white truncate">
                              {t.name}
                            </p>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
                              <span className="truncate">id: {t.slug}</span>
                              {(t.departamento || t.municipio) && (
                                <>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400 truncate font-sans">
                                    <MapPin className="w-2.5 h-2.5" />
                                    {[t.municipio, t.departamento].filter(Boolean).join(', ')}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Director / Admin */}
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-zinc-200">
                            {t.admin_name || 'Sin asignar'}
                          </p>
                          <p className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                            {t.admin_email || 'admin@' + t.slug + '.gov'}
                          </p>
                        </div>
                      </td>

                      {/* Electores Registrados */}
                      <td className="py-3.5 px-4 font-mono tabular-nums">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {current.toLocaleString('es-CO')}
                        </span>
                        <span className="text-slate-400 dark:text-zinc-500 text-[11px] ml-1">electores</span>
                      </td>

                      {/* Fecha de Contratación */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-zinc-400 font-mono tabular-nums text-[11px]">
                        {new Date(t.created_at).toLocaleDateString('es-CO')}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">
                        {t.is_active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium font-mono bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium font-mono bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Suspendida
                          </span>
                        )}
                      </td>

                      {/* Acciones: Edición, Suspensión y Eliminación Definitiva */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Botón Editar Campaña */}
                          <button
                            type="button"
                            onClick={() => setEditingCampaign(t)}
                            className="p-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:text-blue-400 dark:hover:bg-white/[0.06] transition-colors cursor-pointer active:scale-[0.95]"
                            title="Editar configuración de campaña"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(t)}
                            disabled={togglingId === t.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono font-semibold transition-all cursor-pointer active:scale-[0.98] ${
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
                                ? 'opacity-30 border-transparent text-slate-400 dark:text-zinc-600 cursor-not-allowed'
                                : 'border-slate-200 dark:border-white/[0.08] text-slate-400 hover:text-red-500 hover:bg-red-500/10 dark:text-zinc-400 dark:hover:text-red-400 dark:hover:bg-red-950/30 cursor-pointer active:scale-[0.95]'
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={springTransition}
              className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] shadow-2xl p-5 sm:p-7 relative overflow-hidden my-auto max-h-[90vh] overflow-y-auto text-slate-800 dark:text-zinc-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/[0.07]">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      Aprovisionar Nueva Campaña
                    </h2>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-zinc-400">
                      Crea el tenant aislado y su administrador directo
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="mt-4 space-y-4">
                {/* 1. Nombre Comercial */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase font-semibold text-slate-600 dark:text-zinc-400">
                    Nombre Comercial de la Campaña *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Ej. Campaña Montería 2026"
                    className="w-full h-10 px-3.5 bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* 2. Slug */}
                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase font-semibold text-slate-600 dark:text-zinc-400">
                    Identificador Único (Slug) *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="monteria-2026"
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* 3. Jurisdicción Territorial con Selectores en Cascada */}
                <ColombiaGeoSelector
                  departamento={departamento}
                  municipio={municipio}
                  onDepartamentoChange={setDepartamento}
                  onMunicipioChange={setMunicipio}
                  disabled={submitting}
                />

                {/* Separador: Datos del Administrador Responsable */}
                <div className="pt-2 pb-1 border-t border-slate-200 dark:border-white/[0.07]">
                  <p className="text-[11px] font-mono uppercase font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>Administrador Responsable de la Campaña</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase font-semibold text-slate-600 dark:text-zinc-400">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Dr. Carlos Gómez"
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-mono uppercase font-semibold text-slate-600 dark:text-zinc-400">
                      Correo Institucional *
                    </label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@monteria2026.gov"
                      className="w-full h-10 px-3 bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-mono uppercase font-semibold text-slate-600 dark:text-zinc-400 flex items-center justify-between">
                    <span>Contraseña *</span>
                    <span className="text-[10px] font-normal lowercase text-slate-400 dark:text-zinc-500">
                      Mínimo 6 caracteres
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Ingrese la contraseña de acceso..."
                      className="w-full h-10 pl-3.5 pr-10 bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Acciones */}
                <div className="pt-4 border-t border-slate-200 dark:border-white/[0.07] flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={submitting}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] cursor-pointer active:scale-[0.98]"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold uppercase tracking-wider transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={springTransition}
              className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#121215] border border-rose-200 dark:border-rose-500/30 shadow-2xl p-6 sm:p-7 relative overflow-hidden my-auto text-slate-800 dark:text-zinc-100"
            >
              {/* Cabecera del Modal (Alerta Crítica) */}
              <div className="flex flex-col items-start gap-2 mb-4">
                <div className="inline-flex items-center justify-center p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 shadow-xs mb-1">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                      Confirmación de Seguridad Definitiva
                    </h3>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
                      Acción Crítica
                    </span>
                  </div>
                </div>
              </div>

              {/* Texto de Advertencia e Impacto */}
              <div className="space-y-3 mb-5 text-sm">
                <p className="text-slate-600 dark:text-zinc-300 leading-relaxed text-xs">
                  <strong className="text-rose-600 dark:text-rose-400">Atención:</strong> Está a punto de{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">eliminar permanentemente</span> la campaña{' '}
                  <span className="font-mono font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/40">
                    &quot;{tenantToDelete.name}&quot;
                  </span>{' '}
                  y todos sus datos asociados.
                </p>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.07] space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-zinc-400 font-mono">
                    Recursos que serán destruidos permanentemente:
                  </p>
                  <ul className="text-xs text-slate-600 dark:text-zinc-300 space-y-1.5 list-disc list-inside">
                    <li>Todos los electores registrados en el censo de esta campaña</li>
                    <li>Todos los usuarios y perfiles vinculados (excepto SuperAdmin)</li>
                    <li>Todos los registros de auditoría de acceso, logs de exportación y métricas</li>
                  </ul>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/30 text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  <span>Esta acción no se puede deshacer. Los datos no podrán recuperarse.</span>
                </div>
              </div>

              {/* Validación de Seguridad por Texto */}
              <div className="space-y-2 mb-6">
                <label className="block text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Para confirmar, escriba o haga clic en{' '}
                  <button
                    type="button"
                    onClick={() => {
                      const text = 'ELIMINAR MI CAMPAÑA';
                      try {
                        navigator.clipboard.writeText(text);
                      } catch {
                        // ignore
                      }
                      setDeleteConfirmationText(text);
                      setCopiedConfirmation(true);
                      setTimeout(() => setCopiedConfirmation(false), 2500);
                    }}
                    title="Haga clic para copiar y pegar en el recuadro"
                    className="inline-flex items-center gap-1.5 font-mono font-bold text-rose-700 dark:text-rose-300 hover:text-rose-900 dark:hover:text-white bg-rose-50 dark:bg-rose-950/60 hover:dark:bg-rose-900/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800/60 transition-all cursor-pointer shadow-xs active:scale-95 group"
                  >
                    <span>ELIMINAR MI CAMPAÑA</span>
                    {copiedConfirmation ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    )}
                  </button>{' '}
                  a continuación:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    placeholder='Escriba o pegue "ELIMINAR MI CAMPAÑA"'
                    disabled={isDeleting}
                    className="w-full bg-slate-50 dark:bg-[#18181b] border border-slate-200 dark:border-white/[0.08] focus:border-rose-500 rounded-xl pl-4 pr-24 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-zinc-500 font-mono tracking-wide transition-all outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const text = 'ELIMINAR MI CAMPAÑA';
                      try {
                        navigator.clipboard.writeText(text);
                      } catch {
                        // ignore
                      }
                      setDeleteConfirmationText(text);
                      setCopiedConfirmation(true);
                      setTimeout(() => setCopiedConfirmation(false), 2500);
                    }}
                    disabled={isDeleting}
                    title="Pegar automáticamente en el recuadro"
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#121215] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-zinc-300 hover:text-slate-900 dark:hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.96]"
                  >
                    {copiedConfirmation ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-emerald-600 dark:text-emerald-400">Pegado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-400" />
                        <span>Pegar</span>
                      </>
                    )}
                  </button>
                </div>

                {copiedConfirmation && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium font-mono">
                    <Check className="w-3 h-3" />
                    <span>Texto copiado y pegado en el recuadro correctamente.</span>
                  </p>
                )}

                {deleteError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs">
                    {deleteError}
                  </div>
                )}
              </div>

              {/* Botones de Acción (Footer) */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/[0.07] flex items-center justify-end gap-3">
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
                  className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleDeleteTenant}
                  disabled={deleteConfirmationText.trim() !== 'ELIMINAR MI CAMPAÑA' || isDeleting}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md ${
                    deleteConfirmationText.trim() === 'ELIMINAR MI CAMPAÑA' && !isDeleting
                      ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 active:scale-[0.98]'
                      : 'bg-slate-100 dark:bg-[#18181b] text-slate-400 dark:text-zinc-600 border border-slate-200 dark:border-white/[0.06] cursor-not-allowed opacity-50'
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Eliminando datos...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar Definitivamente</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Edición de Campaña / Tenant */}
      {editingCampaign && (
        <EditCampaignModal
          campaign={editingCampaign}
          isOpen={Boolean(editingCampaign)}
          onClose={() => setEditingCampaign(null)}
          onCampaignUpdated={async (updated) => {
            await updateTenant(updated.id || editingCampaign.id, updated);
            setToastMessage(`Campaña "${updated.name || editingCampaign.name}" actualizada con éxito.`);
            setTimeout(() => setToastMessage(null), 4000);
          }}
        />
      )}
    </div>
  );
};
