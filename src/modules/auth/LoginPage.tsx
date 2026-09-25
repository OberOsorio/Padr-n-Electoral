import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Profile } from '../../types';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import { DemoAccountsSelector } from './DemoAccountsSelector';

interface LoginPageProps {
  onSuccess?: (email?: string) => void;
  onBackToLanding?: () => void;
}

export const LoginPage = ({ onSuccess, onBackToLanding }: LoginPageProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reason') === 'session_timeout') {
        setErrorMessage('Su sesión ha expirado por inactividad (60 minutos). Por favor, ingrese de nuevo.');
      }
    } catch {
      // ignore
    }
  }, []);

  const fillDemoCredentials = (roleType: 'superadmin' | 'admin' | 'coordinador' | 'lider' | 'suspended' = 'admin') => {
    if (roleType === 'superadmin') {
      setEmail('superadmin@saas.gov');
      setPassword('SuperAdmin2026*');
    } else if (roleType === 'coordinador') {
      setEmail('coordinador@alcaldia2027.gov');
      setPassword('Coord2026*');
    } else if (roleType === 'lider') {
      setEmail('lider@alcaldia2027.gov');
      setPassword('Lider2026*');
    } else if (roleType === 'suspended') {
      setEmail('admin@caucaunido.org');
      setPassword('Admin2026*');
    } else {
      setEmail('admin@alcaldia2027.gov');
      setPassword('Admin2026*');
    }
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Ingrese su correo electrónico y contraseña.');
      return;
    }

    setLoading(true);

    try {
      // Si Supabase aún no está conectado con variables reales, permitir acceso con credenciales demo autorizadas
      if (!isSupabaseConfigured) {
        const lowerEmail = trimmedEmail.toLowerCase();
        let demoSession: any = null;

        if (lowerEmail === 'superadmin@saas.gov' && password === 'SuperAdmin2026*') {
          demoSession = {
            user: {
              id: 'usr_superadmin_001',
              email: 'superadmin@saas.gov',
              role: 'superadmin',
              tenant_id: null,
              user_metadata: { full_name: 'SuperAdmin Maestro' },
            },
          };
        } else if (
          (lowerEmail === 'admin@alcaldia2027.gov' && password === 'Admin2026*') ||
          (lowerEmail === 'admin@electoral.gov' && password === 'Admin2026*')
        ) {
          demoSession = {
            user: {
              id: 'usr_admin_001_master',
              email: lowerEmail,
              role: 'admin',
              tenant_id: 'ten_alcaldia_2027',
              user_metadata: { full_name: 'Director Campaña Alcaldía 2027' },
            },
          };
        } else if (lowerEmail === 'coordinador@alcaldia2027.gov' && password === 'Coord2026*') {
          demoSession = {
            user: {
              id: 'usr_coord_001',
              email: 'coordinador@alcaldia2027.gov',
              role: 'coordinador',
              tenant_id: 'ten_alcaldia_2027',
              user_metadata: { full_name: 'Cdor. Javier Rivas' },
            },
          };
        } else if (lowerEmail === 'lider@alcaldia2027.gov' && password === 'Lider2026*') {
          demoSession = {
            user: {
              id: 'usr_lider_001',
              email: 'lider@alcaldia2027.gov',
              role: 'lider',
              tenant_id: 'ten_alcaldia_2027',
              user_metadata: { full_name: 'Marcos Benavides' },
            },
          };
        } else if (lowerEmail === 'admin@caucaunido.org' && password === 'Admin2026*') {
          demoSession = {
            user: {
              id: 'usr_cauca_001',
              email: 'admin@caucaunido.org',
              role: 'admin',
              tenant_id: 'ten_cauca_unido',
              user_metadata: { full_name: 'Rodrigo Benítez' },
            },
          };
        }

        if (demoSession) {
          localStorage.setItem('electoral_demo_auth', JSON.stringify(demoSession));
          onSuccess?.(demoSession.user.email);
          return;
        } else {
          setErrorMessage(
            'Credenciales no reconocidas. Pruebe los accesos rápidos demo (SuperAdmin, Admin o Coordinador).'
          );
          return;
        }
      }

      // 1. Inicio de sesión estándar en Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setErrorMessage('Credenciales inválidas. Compruebe el correo y la contraseña.');
        } else if (authError.message.includes('Email not confirmed')) {
          setErrorMessage('La dirección de correo no ha sido confirmada.');
        } else {
          setErrorMessage(authError.message);
        }
        return;
      }

      if (!authData.user) {
        setErrorMessage('No fue posible recuperar la sesión del usuario.');
        return;
      }

      // 2. Validación de estado activo en la tabla 'profiles'
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      const profile = data as Profile | null;

      if (profileError) {
        console.error('Error de verificación de perfil:', profileError);
        await supabase.auth.signOut();
        setErrorMessage('Error al verificar los permisos del usuario.');
        return;
      }

      if (!profile) {
        await supabase.auth.signOut();
        setErrorMessage('Perfil no encontrado en el sistema. Contacte al Administrador.');
        return;
      }

      if (profile.is_active !== true) {
        await supabase.auth.signOut();
        setErrorMessage('Su cuenta se encuentra inactiva. Acceso denegado.');
        return;
      }

      onSuccess?.(authData.user.email);
    } catch (err: unknown) {
      console.error('Error durante autenticación:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Error inesperado durante la autenticación.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-hidden">
      {/* Selector de tema flotante superior */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Sutil gradiente ambiental de fondo */}
      <div 
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/10 dark:from-blue-900/20 via-transparent to-transparent" 
        aria-hidden="true" 
      />

      {/* Tarjeta Ejecutiva */}
      <div className="relative w-full max-w-[430px] rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/60 shadow-xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md p-7 sm:p-8 transition-all">
        {/* Línea de realce superior sutil */}
        <div 
          className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent rounded-t-2xl" 
          aria-hidden="true" 
        />

        {/* Botón de regreso a la Landing Page si aplica */}
        {onBackToLanding && (
          <button
            type="button"
            onClick={onBackToLanding}
            className="mb-5 inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Volver a la portada</span>
          </button>
        )}

        {/* Encabezado / Identidad Institucional */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-11 w-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-500/20 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm mb-4">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={2} />
          </div>

          <h1 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">
            Control Electoral
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-300 mt-1 font-normal">
            Registro y Gestión de Electores
          </p>
        </div>

        {/* Alerta de Error Depurada */}
        {errorMessage && (
          <div className="mb-5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-3.5 py-2.5 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 dark:text-rose-400 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Formulario con políticas estrictas de seguridad */}
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
          <div className="space-y-1.5">
            <label 
              htmlFor="email" 
              className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono"
            >
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                id="email"
                type="email"
                name="email"
                autoComplete="new-password"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                disabled={loading}
                className="w-full h-10.5 pl-10 pr-3.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500/50 transition-all disabled:opacity-50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label 
              htmlFor="password" 
              className="block text-[11px] font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono"
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full h-10.5 pl-10 pr-10 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 rounded-lg text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-500/50 transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 p-1 transition-colors cursor-pointer"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <span>Ingresar al Sistema</span>
              )}
            </button>
          </div>
        </form>

        {/* Acceso Rápido para Demostración Multi-Tenant */}
        <DemoAccountsSelector
          currentEmail={email}
          onSelectAccount={fillDemoCredentials}
        />
      </div>
    </div>
  );
};
