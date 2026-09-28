import React, { useState } from 'react';
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
  Target,
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
    meta_electores?: number;
  }) => Promise<boolean>;
}

export const CreateMemberModal: React.FC<CreateMemberModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'lider' | 'coordinador'>('coordinador');
  const [metaElectoresInput, setMetaElectoresInput] = useState<string | number>(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manejador de cambio fluido (permite campo vacío o solo dígitos)
  const handleMetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^[0-9\b]+$/.test(val)) {
      setMetaElectoresInput(val);
    }
  };

  // Validación al desenfocar (onBlur)
  const handleMetaBlur = () => {
    if (metaElectoresInput === '' || Number(metaElectoresInput) < 1) {
      setMetaElectoresInput(1);
    } else {
      setMetaElectoresInput(Number(metaElectoresInput));
    }
  };

  // Manejador de botones de preajuste
  const handlePresetClick = (valor: number) => {
    setMetaElectoresInput(valor);
  };

  if (!isOpen) return null;

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

    const parsedMeta = Number(metaElectoresInput);
    const finalMeta = !isNaN(parsedMeta) && parsedMeta >= 1 ? parsedMeta : 100;

    // Permisos implícitos según el rol asignado
    const defaultPermissions: UserPermissions = role === 'coordinador'
      ? {
          can_register_electors: true,
          can_view_all_electors: true,
          can_use_bulk_import: true,
          can_export_reports: true,
          can_query_registraduria: true,
        }
      : {
          can_register_electors: true,
          can_view_all_electors: false,
          can_use_bulk_import: false,
          can_export_reports: false,
          can_query_registraduria: true,
        };

    try {
      const success = await onCreate({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        role,
        permissions: defaultPermissions,
        meta_electores: finalMeta,
      });

      if (success) {
        setFullName('');
        setEmail('');
        setPassword('');
        setShowPassword(false);
        setRole('coordinador');
        setMetaElectoresInput(100);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-t-2 border-t-blue-500 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl overflow-hidden transition-all my-auto max-h-[95vh] flex flex-col">
        {/* Cabecera (Header) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Nuevo Miembro del Equipo
              </h3>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                Aprovisionamiento para Líder o Coordinador
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmit} className="mt-5 flex-1 overflow-y-auto pr-1 space-y-4">
          {/* Campo 1: Nombre Completo */}
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

          {/* Campo 2: Correo Registrado */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">
              Correo Electrónico <span className="text-blue-600 dark:text-blue-400">*</span>
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

          {/* Campo 3: Contraseña Provisional */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">
                Contraseña Provisional <span className="text-blue-600 dark:text-blue-400">*</span>
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/60 transition-all cursor-pointer shadow-2xs"
                title="Generar automáticamente una contraseña segura"
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

          {/* Campo 4: Rol Asignado */}
          <div className="space-y-1.5 pt-1">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 font-semibold">
              Rol Asignado
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Tarjeta Coordinador */}
              <div
                onClick={() => setRole('coordinador')}
                className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer select-none ${
                  role === 'coordinador'
                    ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-500 ring-1 ring-blue-500/50 shadow-xs'
                    : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
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
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                  Supervisión de puesto, auditoría y reportes.
                </p>
              </div>

              {/* Tarjeta Líder */}
              <div
                onClick={() => setRole('lider')}
                className={`relative p-3 rounded-2xl border text-left transition-all cursor-pointer select-none ${
                  role === 'lider'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500/50 shadow-xs'
                    : 'bg-slate-50/50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
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
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                  Enrolamiento y captura directa de votantes.
                </p>
              </div>
            </div>
          </div>

          {/* Campo 5: Meta de Electores (Cuota Operativa) */}
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
                type="text"
                inputMode="numeric"
                required
                value={metaElectoresInput}
                onChange={handleMetaChange}
                onBlur={handleMetaBlur}
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
                  onClick={() => handlePresetClick(val)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all cursor-pointer border ${
                    Number(metaElectoresInput) === val
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
              Objetivo inicial acordado. El colaborador podrá superar esta cifra en terreno sin restricciones.
            </p>
          </div>

          {/* Botonera Inferior (Footer) */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/40 flex items-center gap-2 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
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
