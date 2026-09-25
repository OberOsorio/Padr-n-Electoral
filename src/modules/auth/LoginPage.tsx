import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Profile, ActiveSessionData } from '../../types';
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

interface LoginPageProps {
  onSuccess?: (sessionData: ActiveSessionData) => void;
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
        } else if (
          authError.message.includes('Failed to fetch') ||
          authError.message.includes('Load failed')
        ) {
          setErrorMessage('Error de red al conectar con Supabase. Compruebe su conexión a internet.');
        } else {
          setErrorMessage(authError.message);
        }
        return;
      }

      if (!authData.user) {
        setErrorMessage('No fue posible recuperar la sesión del usuario.');
        return;
      }

      // 2. Consulta y validación de perfil real en la base de datos
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error de verificación de perfil:', profileError);
      }

      const profile = profileData as Profile | null;

      // Si el perfil existe pero está marcado como inactivo o suspendido
      if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        setErrorMessage('Su cuenta se encuentra inactiva o suspendida. Comuníquese con el Administrador.');
        return;
      }

      // Identificar rol del usuario desde su perfil o metadata
      const userRole = (
        profile?.role ||
        authData.user.user_metadata?.role ||
        'admin'
      ).toLowerCase();

      const userName =
        profile?.full_name ||
        authData.user.user_metadata?.full_name ||
        authData.user.email?.split('@')[0] ||
        'Usuario del Sistema';

      const tenantId = profile?.tenant_id || (authData.user.user_metadata?.tenant_id as string) || null;

      // Limpiar residuos de datos demo en el navegador
      localStorage.removeItem('electoral_demo_auth');

      const sessionData: ActiveSessionData = {
        email: authData.user.email || trimmedEmail,
        id: authData.user.id,
        userName,
        role: userRole,
        tenantId,
        isDemo: false,
      };

      onSuccess?.(sessionData);
    } catch (err: unknown) {
      console.error('Error durante autenticación:', err);
      const rawMsg = err instanceof Error ? err.message : String(err);
      if (rawMsg.includes('Load failed') || rawMsg.includes('Failed to fetch')) {
        setErrorMessage('Error de red al conectar con Supabase. Compruebe su conexión a internet.');
      } else {
        setErrorMessage(rawMsg || 'Error inesperado durante la autenticación.');
      }
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
      </div>
    </div>
  );
};

