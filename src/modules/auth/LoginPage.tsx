import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Profile, ActiveSessionData } from '../../types';
import {
  Shield,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Clock,
  X,
  ArrowLeft,
} from 'lucide-react';
import { translateAuthError } from '../../utils/authErrorMapper';

export interface LoginPageProps {
  onSuccess?: (sessionData: ActiveSessionData) => void;
  onBackToLanding?: () => void;
  onNavigateToRegister?: () => void;
  onForgotPassword?: () => void;
  brandName?: string;
  tagline?: string;
}

/**
 * Fondo poligonal geométrico de baja poligonización (Low-Poly)
 * que brinda la atmósfera corporativa y tecnológica unificada de la plataforma.
 */
const PolygonalFacetBackground: React.FC = () => (
  <svg
    className="absolute inset-0 w-full h-full object-cover pointer-events-none opacity-40 select-none"
    viewBox="0 0 1440 900"
    preserveAspectRatio="xMidYMid slice"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="facet1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#162032" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#080c16" stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id="facet2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1f2c42" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#060912" stopOpacity="0.95" />
      </linearGradient>
      <linearGradient id="facet3" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0b111e" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#182336" stopOpacity="0.35" />
      </linearGradient>
    </defs>
    <polygon points="0,0 380,0 220,320" fill="url(#facet1)" />
    <polygon points="380,0 760,0 540,280" fill="url(#facet2)" />
    <polygon points="760,0 1140,0 920,300" fill="url(#facet1)" />
    <polygon points="1140,0 1440,0 1280,340" fill="url(#facet2)" />
    <polygon points="0,0 220,320 0,480" fill="url(#facet3)" />
    <polygon points="220,320 540,280 400,560" fill="url(#facet2)" />
    <polygon points="540,280 920,300 720,600" fill="url(#facet1)" />
    <polygon points="920,300 1280,340 1100,620" fill="url(#facet3)" />
    <polygon points="1280,340 1440,0 1440,540" fill="url(#facet1)" />
    <polygon points="0,480 400,560 190,740" fill="url(#facet1)" />
    <polygon points="400,560 720,600 560,840" fill="url(#facet3)" />
    <polygon points="720,600 1100,620 940,860" fill="url(#facet2)" />
    <polygon points="1100,620 1440,540 1340,800" fill="url(#facet1)" />
    <polygon points="0,480 190,740 0,900" fill="url(#facet2)" />
    <polygon points="190,740 560,840 380,900" fill="url(#facet1)" />
    <polygon points="560,840 940,860 760,900" fill="url(#facet3)" />
    <polygon points="940,860 1340,800 1160,900" fill="url(#facet2)" />
    <polygon points="1340,800 1440,540 1440,900" fill="url(#facet1)" />
  </svg>
);

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onBackToLanding,
  onForgotPassword,
  brandName = 'ControlElectoral',
  tagline = 'GESTIÓN DE PADRÓN & TERRITORIO',
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [timeoutMessage, setTimeoutMessage] = useState<string | null>(null);
  const [savedEmails, setSavedEmails] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('electoral_saved_emails');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedEmails(parsed);
        }
      }
      const savedEmail = localStorage.getItem('electoral_remember_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reason') === 'session_timeout') {
        setTimeoutMessage('Su sesión ha expirado por inactividad (60 minutos). Por favor, ingrese de nuevo.');

        const timer = setTimeout(() => {
          setTimeoutMessage(null);
          try {
            const url = new URL(window.location.href);
            url.searchParams.delete('reason');
            window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
          } catch {
            // ignore
          }
        }, 30000);

        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setTimeoutMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Por favor ingresa tu usuario o correo y contraseña.');
      return;
    }

    try {
      const updated = Array.from(new Set([trimmedEmail.toLowerCase(), ...savedEmails])).slice(0, 10);
      setSavedEmails(updated);
      localStorage.setItem('electoral_saved_emails', JSON.stringify(updated));

      if (rememberMe) {
        localStorage.setItem('electoral_remember_email', trimmedEmail);
      } else {
        localStorage.removeItem('electoral_remember_email');
      }
    } catch {
      // ignore
    }

    setLoading(true);

    try {
      // 1. Inicio de sesión en Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      let effectiveUser = authData?.user;

      if (authError) {
        if (
          authError.message.includes('Email not confirmed') ||
          (authError as any).code === 'email_not_confirmed'
        ) {
          try {
            await (supabase.rpc as any)('confirmar_usuario_por_email', { p_email: trimmedEmail });
            const { data: retryAuth, error: retryError } = await supabase.auth.signInWithPassword({
              email: trimmedEmail,
              password,
            });
            if (!retryError && retryAuth.user) {
              effectiveUser = retryAuth.user;
            } else {
              setErrorMessage('Cuenta confirmada con éxito. Por favor ingrese de nuevo.');
              return;
            }
          } catch {
            setErrorMessage(translateAuthError(authError));
            return;
          }
        } else {
          setErrorMessage(translateAuthError(authError));
          return;
        }
      }

      if (!effectiveUser) {
        setErrorMessage('No fue posible recuperar la sesión. Verifica tus credenciales.');
        return;
      }

      // 2. Consulta y validación de perfil real en la base de datos
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', effectiveUser.id)
        .maybeSingle();

      if (profileError) {
        console.warn('Advertencia de perfil en inicio de sesión:', profileError);
      }

      const profile = profileData as Profile | null;

      if (profile && profile.is_active === false) {
        await supabase.auth.signOut();
        setErrorMessage('Esta cuenta ha sido suspendida por la administración de la plataforma.');
        return;
      }

      const isSuperAdminEmail = (effectiveUser.email || trimmedEmail).toLowerCase().trim() === 'oberosorio1@gmail.com';
      let userRole = (
        (isSuperAdminEmail ? 'superadmin' : null) ||
        profile?.role ||
        effectiveUser.user_metadata?.role ||
        'admin'
      ).toLowerCase();

      if (isSuperAdminEmail && profile && profile.role !== 'superadmin') {
        userRole = 'superadmin';
        try {
          await (supabase.from('profiles') as any)
            .update({ role: 'superadmin' })
            .eq('id', effectiveUser.id);
        } catch {
          // ignore
        }
      }

      const userName =
        profile?.full_name ||
        effectiveUser.user_metadata?.full_name ||
        effectiveUser.email?.split('@')[0] ||
        'Usuario';

      const tenantId = profile?.tenant_id || (effectiveUser.user_metadata?.tenant_id as string) || null;

      localStorage.removeItem('electoral_demo_auth');
      sessionStorage.removeItem('electoral_superadmin_mode');

      const sessionData: ActiveSessionData = {
        email: effectiveUser.email || trimmedEmail,
        id: effectiveUser.id,
        userName,
        role: userRole,
        tenantId,
        isDemo: false,
      };

      onSuccess?.(sessionData);
    } catch (err: unknown) {
      console.error('Error durante autenticación:', err);
      setErrorMessage(translateAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordClick = () => {
    if (onForgotPassword) {
      onForgotPassword();
    } else {
      setInfoMessage('Para recuperar o restablecer tu contraseña, contacta al Administrador de la plataforma.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#070b13] flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden select-none">
      {/* Fondo Poligonal Geométrico */}
      <PolygonalFacetBackground />

      {/* Resplandor ambiental central en azul noche sutil */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[520px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Botón Volver al inicio si está disponible */}
      {onBackToLanding && (
        <button
          type="button"
          onClick={onBackToLanding}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer bg-[#0e1524]/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/60 shadow-lg hover:border-slate-600"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al inicio</span>
        </button>
      )}

      {/* TARJETA CENTRAL EN UN SOLO TONO OSCURO HOMOGÉNEO */}
      <div className="relative z-10 w-full max-w-4xl bg-[#0c121e]/95 backdrop-blur-2xl rounded-[26px] md:rounded-[28px] shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_35px_rgba(14,165,233,0.06)] overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[520px] md:min-h-[570px] border border-slate-800/90">
        
        {/* ======================================================== */}
        {/* PANEL IZQUIERDO: IDENTIDAD INSTITUCIONAL                 */}
        {/* ======================================================== */}
        <div className="relative bg-[#090e18] p-8 sm:p-10 md:p-12 flex flex-col justify-center items-center text-center overflow-hidden border-b md:border-b-0 md:border-r border-slate-800/80">
          
          {/* Malla poligonal interna */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <svg
              className="w-full h-full object-cover"
              viewBox="0 0 600 600"
              xmlns="http://www.w3.org/2000/svg"
            >
              <polygon points="0,0 300,100 120,400" fill="#1e293b" fillOpacity="0.4" />
              <polygon points="300,100 600,0 480,320" fill="#0f172a" fillOpacity="0.6" />
              <polygon points="120,400 480,320 300,600" fill="#334155" fillOpacity="0.25" />
              <polygon points="0,0 120,400 0,600" fill="#0b0f19" fillOpacity="0.7" />
              <polygon points="600,0 600,600 480,320" fill="#1e293b" fillOpacity="0.3" />
              <polygon points="0,600 300,600 600,600" fill="#0a0e17" fillOpacity="0.8" />
            </svg>
          </div>

          {/* Destello radial tenue */}
          <div className="absolute inset-0 bg-radial from-blue-500/10 via-transparent to-transparent pointer-events-none" />

          {/* Contenido institucional */}
          <div className="relative z-10 w-full max-w-xs mx-auto flex flex-col items-center py-6">
            
            {/* Logotipo e Isotipo Institucional Integrado */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 ring-1 ring-cyan-400/40 shrink-0">
                <Shield className="w-6 h-6 text-white" strokeWidth={2.3} />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-mono tracking-[0.22em] text-slate-400 uppercase font-bold leading-none">
                  PLATAFORMA OFICIAL
                </span>
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight font-sans mt-0.5">
                  {brandName === 'ControlElectoral' ? (
                    <>
                      Control<span className="text-cyan-400 font-extrabold">Electoral</span>
                    </>
                  ) : (
                    brandName
                  )}
                </span>
              </div>
            </div>

            {/* Separador Limpio y Elegante sin parches oscuros */}
            <div className="flex items-center justify-center gap-3 my-5 w-full max-w-[280px]">
              <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-slate-700/80" />
              <span className="text-[10px] tracking-[0.3em] font-semibold text-slate-400 uppercase select-none">
                Acceso al Sistema
              </span>
              <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-slate-700/80" />
            </div>

            {/* Subtítulo Temático Oficial */}
            <p className="text-[11px] font-semibold text-slate-400 tracking-[0.22em] uppercase select-none">
              {tagline}
            </p>
          </div>
        </div>

        {/* ======================================================== */}
        {/* PANEL DERECHO: FORMULARIO EN EL MISMO TONO OSCURO        */}
        {/* ======================================================== */}
        <div className="bg-[#0c121e] p-8 sm:p-10 md:p-14 flex flex-col justify-center relative">
          <div className="max-w-sm w-full mx-auto">
            
            {/* Encabezado */}
            <div className="mb-7">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Bienvenido
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                Ingresa tus credenciales oficiales para continuar.
              </p>
            </div>

            {/* Alerta de Sesión Expirada */}
            {timeoutMessage && (
              <div className="mb-5 rounded-xl bg-amber-500/10 border border-amber-500/30 px-3.5 py-2.5 text-xs text-amber-300 flex items-start justify-between gap-2 animate-in fade-in duration-300">
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                  <span className="leading-snug">{timeoutMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTimeoutMessage(null)}
                  className="text-amber-400 hover:text-amber-200 p-0.5 shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Alerta de Error */}
            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-start gap-2 animate-in fade-in duration-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            {/* Notificación informativa */}
            {infoMessage && (
              <div className="mb-5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-medium flex items-start justify-between gap-2 animate-in fade-in duration-300">
                <span>{infoMessage}</span>
                <button
                  type="button"
                  onClick={() => setInfoMessage(null)}
                  className="text-blue-400 hover:text-blue-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="on" className="space-y-4 sm:space-y-5">
              
              {/* CAMPO: USUARIO / CORREO */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Usuario / Correo Electrónico
                </label>
                <div className="flex items-center bg-[#070b13] border border-slate-700/80 rounded-xl px-3.5 py-2.5 focus-within:bg-[#05080e] focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20 transition-all">
                  <span className="text-slate-500 font-mono text-sm mr-2.5 select-none shrink-0">
                    @
                  </span>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email username"
                    list="saved-emails-list"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@campana.com"
                    disabled={loading}
                    className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-medium login-input"
                  />
                  <datalist id="saved-emails-list">
                    {savedEmails.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* CAMPO: CONTRASEÑA */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={handleForgotPasswordClick}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="flex items-center bg-[#070b13] border border-slate-700/80 rounded-xl px-3.5 py-2.5 focus-within:bg-[#05080e] focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-400/20 transition-all">
                  <span className="text-slate-500 font-mono text-sm mr-2.5 select-none shrink-0">
                    #
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none font-medium tracking-wide login-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-200 ml-2 focus:outline-none cursor-pointer"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Recordar dispositivo */}
              <div className="flex items-center justify-between pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-slate-700 bg-[#070b13] text-cyan-500 focus:ring-0 cursor-pointer accent-cyan-500"
                  />
                  <span className="text-xs text-slate-400 font-medium">Recordar este dispositivo</span>
                </label>
              </div>

              {/* BOTÓN: INICIAR SESIÓN */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-cyan-500/35 active:scale-[0.99] flex items-center justify-center gap-2 text-sm disabled:opacity-60 cursor-pointer"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{loading ? 'Verificando credenciales...' : 'Iniciar Sesión'}</span>
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export const LoginFormAdaptive = LoginPage;
export const ProfessionalLoginForm = LoginPage;
export default LoginPage;
