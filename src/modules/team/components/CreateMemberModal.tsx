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

  // Cambiar rol y actualizar matriz de permisos por defecto
  const handleRoleSelect = (selectedRole: 'lider' | 'coordinador') => {
    setRole(selectedRole);
    setPermissions({ ...DEFAULT_ROLE_PERMISSIONS[selectedRole] });
  };

  // Alternar checkbox individual de permisos
  const togglePermission = (key: keyof UserPermissions) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Generador de contraseñas seguras y legibles
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

  const permissionItems: {
    key: keyof UserPermissions;
    title: string;
    description: string;
    icon: typeof UserPlus;
  }[] = [
    {
      key: 'can_register_electors',
      title: 'Registrar Elector manualmente',
      description: 'Habilita el formulario para inscribir votantes de manera individual.',
      icon: UserPlus,
    },
    {
      key: 'can_view_all_electors',
      title: 'Ver lista completa del padrón',
      description: 'Permite auditar todo el padrón (desactivado: solo ve sus registros propios).',
      icon: Users,
    },
    {
      key: 'can_use_bulk_import',
      title: 'Acceso a Carga Masiva',
      description: 'Permite importar listados y planillas electorales en Excel / CSV.',
      icon: FileSpreadsheet,
    },
    {
      key: 'can_export_reports',
      title: 'Descarga de reportes en Excel',
      description: 'Habilita la exportación y auditoría de electores a hojas de cálculo.',
      icon: Download,
    },
    {
      key: 'can_query_registraduria',
      title: 'Consulta oficial de censo',
      description: 'Permite verificar el puesto y mesa de votación oficial por cédula.',
      icon: Search,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 shadow-2xl overflow-hidden transition-colors">
        {/* Línea de realce superior */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* Encabezado fijo */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-slate-200 dark:border-slate-700/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Nuevo Miembro del Equipo
              </h3>
              <p className="text-[11px] font-mono text-amber-600 dark:text-[#E5B869] font-medium">
                Aprovisionamiento de Acceso Operativo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo desplazable */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 space-y-4.5 flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-xs text-rose-800 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Nombre Completo */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
              Nombre Completo <span className="text-blue-600 dark:text-blue-400">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-400 pointer-events-none" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Roberto Gómez Bolaños"
                className="w-full h-10 pl-10 pr-3.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Correo Electrónico */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
              Correo Registrado <span className="text-blue-600 dark:text-blue-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-400 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@ejemplo.com"
                className="w-full h-10 pl-10 pr-3.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Contraseña Provisional */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
                Contraseña Provisional <span className="text-blue-600 dark:text-blue-400">*</span>
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
                title="Generar una clave aleatoria segura"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generar aleatoria</span>
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-400 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full h-10 pl-10 pr-10 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              El usuario podrá iniciar sesión inmediatamente con esta clave.
            </p>
          </div>

          {/* Rol del Miembro: Excluido Admin, solo Líder y Coordinador */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[11px] font-mono uppercase text-slate-600 dark:text-slate-400">
              Rol Asignado
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleRoleSelect('lider')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  role === 'lider'
                    ? 'bg-emerald-50 dark:bg-emerald-600/15 border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    Líder
                  </span>
                  {role === 'lider' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Enrolamiento en terreno y registro directo de votantes.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelect('coordinador')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  role === 'coordinador'
                    ? 'bg-blue-50 dark:bg-blue-600/15 border-blue-500 text-blue-950 dark:text-blue-100 ring-1 ring-blue-500 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/90 border-slate-200 dark:border-slate-700/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Coordinador
                  </span>
                  {role === 'coordinador' && (
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Gestión integral de zona, auditoría de padrón y reportes.
                </p>
              </button>
            </div>
          </div>

          {/* Matriz de Permisos Habilitados */}
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-mono uppercase text-slate-700 dark:text-slate-300 font-semibold tracking-wider">
                Permisos Habilitados en la Plataforma
              </label>
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                Personalizable
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-900/50 divide-y divide-slate-200 dark:divide-slate-800/80 overflow-hidden">
              {permissionItems.map((item) => {
                const isChecked = !!permissions[item.key];
                const IconComponent = item.icon;

                return (
                  <label
                    key={item.key}
                    onClick={() => togglePermission(item.key)}
                    className="flex items-start gap-3 p-2.5 sm:p-3 hover:bg-white dark:hover:bg-slate-800/80 transition-colors cursor-pointer select-none group"
                  >
                    <div className="pt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Manejado por onClick en label
                        className="w-4 h-4 rounded text-blue-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <IconComponent className={`w-3.5 h-3.5 shrink-0 ${
                          isChecked ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'
                        }`} />
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-700/60 text-xs font-mono text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-blue-500/20"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Shield className="w-3.5 h-3.5" />
              )}
              <span>Crear Acceso</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
