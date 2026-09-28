import React, { useState, useEffect } from 'react';
import type { AppRole, UserPermissions, TeamMember } from '../../../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../../../types';
import {
  X,
  Pencil,
  Mail,
  User,
  Loader2,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Search,
  Users,
  SlidersHorizontal,
  RotateCcw,
  Target,
  UserPlus,
} from 'lucide-react';

interface EditMemberModalProps {
  isOpen: boolean;
  member: TeamMember | null;
  onClose: () => void;
  onUpdate: (
    id: string,
    data: {
      full_name: string;
      role: AppRole;
      meta_electores: number;
      permissions: UserPermissions;
    }
  ) => Promise<boolean>;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  member,
  onClose,
  onUpdate,
}) => {
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'lider' | 'coordinador'>('coordinador');
  const [metaElectores, setMetaElectores] = useState<number>(100);
  const [permissions, setPermissions] = useState<UserPermissions>(
    DEFAULT_ROLE_PERMISSIONS.coordinador
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar valores iniciales del miembro seleccionado
  useEffect(() => {
    if (member) {
      setFullName(member.full_name || '');
      const assignedRole = member.role === 'lider' ? 'lider' : 'coordinador';
      setRole(assignedRole);
      setMetaElectores(member.meta_electores && member.meta_electores > 0 ? member.meta_electores : 100);
      setPermissions(member.permissions || DEFAULT_ROLE_PERMISSIONS[assignedRole]);
      setError(null);
    }
  }, [member, isOpen]);

  if (!isOpen || !member) return null;

  // Cambiar rol y sugerir permisos por defecto para ese rol si el usuario lo desea
  const handleRoleSelect = (selectedRole: 'lider' | 'coordinador') => {
    setRole(selectedRole);
  };

  // Alternar switch individual de permisos
  const togglePermission = (key: keyof UserPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Por favor ingrese el nombre completo del colaborador.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await onUpdate(member.id, {
        full_name: fullName.trim(),
        role,
        meta_electores: metaElectores && metaElectores > 0 ? metaElectores : 100,
        permissions,
      });

      if (success) {
        onClose();
      } else {
        setError('No se pudo guardar la información del colaborador.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado al guardar cambios.');
    } finally {
      setLoading(false);
    }
  };

  // Contador de capacidades habilitadas
  const activePermissionsCount = Object.values(permissions).filter(Boolean).length;

  const permissionItems: {
    key: keyof UserPermissions;
    title: string;
    description: string;
    badge: string;
    badgeClass: string;
    icon: typeof UserPlus;
  }[] = [
    {
      key: 'can_register_electors',
      title: 'Registrar Elector manualmente',
      description: 'Habilita el formulario de enrolamiento en terreno.',
      badge: 'Operativo',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      icon: UserPlus,
    },
    {
      key: 'can_view_all_electors',
      title: 'Ver lista completa del padrón',
      description: 'Auditoría del censo general (desactivado: solo registros propios).',
      badge: 'Auditoría',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      icon: Users,
    },
    {
      key: 'can_use_bulk_import',
      title: 'Acceso a Carga Masiva',
      description: 'Permite importar planillas masivas de electores en Excel / CSV.',
      badge: 'Planillas',
      badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
      icon: FileSpreadsheet,
    },
    {
      key: 'can_export_reports',
      title: 'Descarga de reportes en Excel',
      description: 'Exportación de bases filtradas.',
      badge: 'Reportes',
      badgeClass: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
      icon: Download,
    },
    {
      key: 'can_query_registraduria',
      title: 'Consulta de Censo Registraduría',
      description: 'Acceso a la verificación oficial de puesto y mesa.',
      badge: 'Oficial',
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      icon: Search,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl lg:max-w-5xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 border-t-2 border-t-blue-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl overflow-hidden transition-all my-auto max-h-[94vh] flex flex-col">
        {/* Cabecera (Header) */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Editar Colaborador y Meta
              </h3>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                Ajuste de datos operativos, cuota individual y permisos RBAC
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-xs text-rose-800 dark:text-rose-300">
            {error}
          </div>
        )}

        {/* Cuerpo del Formulario en 2 Columnas Balanceadas */}
        <form onSubmit={handleSubmit} className="mt-6 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 sm:gap-8 items-start">
            {/* Columna Izquierda: Datos del colaborador, Rol y Meta (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-4.5">
              {/* Fila 1: Nombre Completo */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">
                  Nombre Completo <span className="text-blue-600 dark:text-blue-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ej. Roberto Gómez Bolaños"
                    className="w-full h-10.5 pl-10 pr-3.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Fila 2: Correo Registrado (Identidad de Acceso - Solo Lectura) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">
                    Correo Registrado
                  </label>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    Identificador de cuenta
                  </span>
                </div>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    disabled
                    value={member.email || 'Sin correo registrado'}
                    className="w-full h-10.5 pl-10 pr-3.5 bg-slate-100/80 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800/80 rounded-xl text-xs font-mono text-slate-500 dark:text-slate-400 cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* Fila 3: Rol Asignado */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">
                  Rol Asignado
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
                  {/* Tarjeta Líder */}
                  <div
                    onClick={() => handleRoleSelect('lider')}
                    className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer select-none ${
                      role === 'lider'
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/25 border-emerald-500 dark:border-emerald-500/80 ring-1 ring-emerald-500/40 shadow-xs'
                        : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          Líder
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                          Terreno
                        </span>
                      </div>
                      {role === 'lider' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Enrolamiento territorial y captura directa de electores asignados.
                    </p>
                  </div>

                  {/* Tarjeta Coordinador */}
                  <div
                    onClick={() => handleRoleSelect('coordinador')}
                    className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer select-none ${
                      role === 'coordinador'
                        ? 'bg-blue-50/80 dark:bg-blue-950/25 border-blue-500 dark:border-blue-500/80 ring-1 ring-blue-500/40 shadow-xs'
                        : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                          Coordinador
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-medium">
                          Gestión
                        </span>
                      </div>
                      {role === 'coordinador' && (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                      Supervisión de puesto/zona, auditoría de padrón y exportaciones.
                    </p>
                  </div>
                </div>
              </div>

              {/* Fila 4: Meta de Electores (Cuota Operativa) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">
                    Meta de Electores (Cuota) <span className="text-blue-600 dark:text-blue-400">*</span>
                  </label>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                    No bloqueante
                  </span>
                </div>

                <div className="relative">
                  <Target className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="number"
                    min={1}
                    required
                    value={metaElectores || ''}
                    onChange={(e) => setMetaElectores(Math.max(1, parseInt(e.target.value) || 0))}
                    placeholder="100"
                    className="w-full h-10.5 pl-10 pr-3.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                {/* Botones Presets Rápidos */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mr-1">Preajuste:</span>
                  {[50, 100, 200, 500].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMetaElectores(val)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all cursor-pointer border ${
                        metaElectores === val
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Ajustable en cualquier momento. No altera los electores ya inscritos ({member.totalElectores || 0} registrados).
                </p>
              </div>
            </div>

            {/* Columna Derecha: Matriz de Permisos (lg:col-span-7) */}
            <div className="lg:col-span-7 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
              {/* Cabecera de Permisos */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                    <SlidersHorizontal className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 font-mono">
                      Permisos Habilitados en la Plataforma
                    </h4>
                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      {activePermissionsCount} de 5 capacidades activas para este usuario
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPermissions({ ...DEFAULT_ROLE_PERMISSIONS[role] })}
                  className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 px-2.5 py-1 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
                  title="Restablecer los permisos sugeridos para el rol seleccionado"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>↺ Restablecer</span>
                </button>
              </div>

              {/* Lista de Micro-Tarjetas de Permiso */}
              <div className="space-y-2.5 flex-1">
                {permissionItems.map((item) => {
                  const isChecked = !!permissions[item.key];
                  const IconComponent = item.icon;

                  return (
                    <div
                      key={item.key}
                      onClick={() => togglePermission(item.key)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all cursor-pointer select-none group ${
                        isChecked
                          ? 'border-blue-500/30 dark:border-blue-500/40 bg-white dark:bg-slate-900/90 shadow-2xs'
                          : 'border-slate-200/80 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 opacity-75 hover:opacity-100'
                      }`}
                    >
                      {/* Icono + Título + Badge + Descripción */}
                      <div className="flex items-center gap-3.5 min-w-0 pr-2">
                        <div
                          className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                            isChecked
                              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400'
                              : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400'
                          }`}
                        >
                          <IconComponent className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {item.title}
                            </span>
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-medium ${item.badgeClass}`}
                            >
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5 truncate">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Switch Visual */}
                      <div
                        className={`w-10 h-5.5 rounded-full transition-colors relative shrink-0 p-0.5 ${
                          isChecked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-4.5 h-4.5 rounded-full bg-white transition-transform shadow-xs ${
                            isChecked ? 'translate-x-4.5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Nota informativa inferior */}
              <div className="pt-2 text-[10px] font-mono text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80">
                Los cambios se aplican de forma inmediata tras guardar.
              </div>
            </div>
          </div>

          {/* Footer Fijo con Botones de Acción */}
          <div className="mt-7 pt-5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md hover:shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{loading ? 'Guardando cambios...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
