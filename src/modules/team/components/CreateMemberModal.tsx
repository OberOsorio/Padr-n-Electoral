import { useState } from 'react';
import type { AppRole, UserPermissions } from '../../../types';
import { DEFAULT_ROLE_PERMISSIONS } from '../../../types';
import {
  X,
  UserPlus,
  Mail,
  Lock,
  User,
  Shield,
  Loader2,
  CheckCircle2,
  Eye,
  EyeOff,
  Sparkles,
  FileSpreadsheet,
  Download,
  Search,
  Users,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

interface CreateMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    full_name: string;
    email: string;
    password?: string;
    role: AppRole;
    permissions?: UserPermissions;
  }) => Promise<boolean>;
}

export const CreateMemberModal = ({
  isOpen,
  onClose,
  onCreate,
}: CreateMemberModalProps) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'lider' | 'coordinador'>('coordinador');
  const [permissions, setPermissions] = useState<UserPermissions>(
    DEFAULT_ROLE_PERMISSIONS.coordinador
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Cambiar rol y sincronizar matriz de permisos con la plantilla recomendada
  const handleRoleSelect = (selectedRole: 'lider' | 'coordinador') => {
    setRole(selectedRole);
    setPermissions({ ...DEFAULT_ROLE_PERMISSIONS[selectedRole] });
  };

  // Alternar switch individual de permisos
  const togglePermission = (key: keyof UserPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Generador de contraseñas de alta seguridad
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*';
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '23456789';
    const symbols = '!@#$%*';

    let pass = '';
    pass += upper[Math.floor(Math.random() * upper.length)];
    pass += numbers[Math.floor(Math.random() * numbers.length)];
    pass += symbols[Math.floor(Math.random() * symbols.length)];

    for (let i = 0; i < 7; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }

    const shuffled = pass.split('').sort(() => 0.5 - Math.random()).join('');
    setPassword(shuffled);
    setShowPassword(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setError('Por favor complete el nombre y correo electrónico.');
      return;
    }

    if (!password.trim() || password.trim().length < 6) {
      setError('La contraseña provisional debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const success = await onCreate({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role,
        permissions,
      });

      if (success) {
        setFullName('');
        setEmail('');
        setPassword('');
        setShowPassword(false);
        setRole('coordinador');
        setPermissions(DEFAULT_ROLE_PERMISSIONS.coordinador);
        onClose();
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Error inesperado al crear el miembro.'
      );
    } finally {
      setLoading(false);
    }
  };

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
      <div className="relative w-full max-w-4xl lg:max-w-5xl bg-white dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 border-t-2 border-t-emerald-500/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl overflow-hidden transition-all my-auto max-h-[94vh] flex flex-col">
        {/* Cabecera (Header) */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Nuevo Miembro del Equipo
              </h3>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                Aprovisionamiento y Control de Accesos RBAC
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
            {/* Columna Izquierda: Credenciales y Rol (lg:col-span-5) */}
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

              {/* Fila 2: Correo Registrado */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">
                  Correo Registrado <span className="text-blue-600 dark:text-blue-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    className="w-full h-10.5 pl-10 pr-3.5 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Fila 3: Contraseña Provisional */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">
                    Contraseña Provisional <span className="text-blue-600 dark:text-blue-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/60 transition-all cursor-pointer shadow-2xs"
                    title="Generar automáticamente una contraseña de alta seguridad"
                  >
                    <Sparkles className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                    <span>✨ Generar segura</span>
                  </button>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full h-10.5 pl-10 pr-10 bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-blue-500 transition-all tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer transition-colors"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  El usuario podrá autenticarse inmediatamente tras la creación del acceso.
                </p>
              </div>

              {/* Fila 4: Rol Asignado */}
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
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25 shadow-2xs'
                              : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 border-slate-200 dark:border-slate-700/50'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-semibold transition-colors ${
                                isChecked
                                  ? 'text-slate-900 dark:text-white'
                                  : 'text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {item.title}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-medium border ${item.badgeClass}`}
                            >
                              {item.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      {/* Switch Reactivo Estilo iOS / Enterprise */}
                      <div
                        role="switch"
                        aria-checked={isChecked}
                        className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isChecked
                            ? 'bg-blue-600 dark:bg-blue-500'
                            : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            isChecked ? 'translate-x-4.5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Botonera Inferior (Footer Fijo) */}
          <div className="flex items-center justify-end gap-3 mt-7 pt-5 border-t border-slate-200 dark:border-slate-800/80 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-950/50 flex items-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              <span>CREAR ACCESO</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
