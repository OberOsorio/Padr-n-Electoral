import { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabase';
import type { Profile, ActiveSessionData } from './types';
import { LoginPage } from './modules/auth/LoginPage';
import { ResetPasswordView } from './modules/auth/ResetPasswordView';
import { LandingPage } from './modules/public/LandingPage';
import { AppRouter } from './routes/AppRouter';
import { TenantProvider } from './context/TenantContext';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

const SUPERADMIN_EMAILS = ['oberosorio1@gmail.com'];

async function buildSessionFromAuthUser(authUser: any): Promise<ActiveSessionData | null> {
  const email = (authUser.email || '').toLowerCase().trim();
  const isSuperAdminEmail = SUPERADMIN_EMAILS.includes(email);

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  let profile = profileData as Profile | null;

  if (profile && profile.is_active === false) {
    await supabase.auth.signOut();
    return null;
  }

  // Si el usuario autenticado no tiene un perfil creado en la base de datos, crearlo automáticamente
  if (!profile && authUser.id) {
    try {
      const defaultRole = isSuperAdminEmail ? 'admin' : (authUser.user_metadata?.role || 'admin');
      const fullName =
        authUser.user_metadata?.full_name ||
        authUser.email?.split('@')[0] ||
        'Administrador General';

      const { data: newProf, error: newProfErr } = await (supabase.from('profiles') as any)
        .upsert(
          {
            id: authUser.id,
            full_name: fullName,
            role: defaultRole,
            is_active: true,
          },
          { onConflict: 'id' }
        )
        .select('*')
        .maybeSingle();

      if (!newProfErr && newProf) {
        profile = newProf as Profile;
      }
    } catch (e) {
      console.warn('Error al auto-crear perfil para el usuario autenticado:', e);
    }
  }

  let userRole = (
    (isSuperAdminEmail ? 'superadmin' : null) ||
    profile?.role ||
    authUser.user_metadata?.role ||
    'admin'
  ).toLowerCase();

  if (isSuperAdminEmail && profile && profile.role !== 'superadmin') {
    userRole = 'superadmin';
    try {
      await (supabase.from('profiles') as any)
        .update({ role: 'superadmin' })
        .eq('id', authUser.id);
    } catch (healErr) {
      console.warn('Auto-heal superadmin role failed:', healErr);
    }
  }

  const userName =
    profile?.full_name ||
    authUser.user_metadata?.full_name ||
    authUser.email?.split('@')[0] ||
    'Ober Osorio';

  const tenantId = profile?.tenant_id || (authUser.user_metadata?.tenant_id as string) || null;

  return {
    email: authUser.email || '',
    id: authUser.id,
    userName,
    role: userRole,
    tenantId,
    isDemo: false,
  };
}

export default function App() {
  const [session, setSession] = useState<ActiveSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [publicView, setPublicView] = useState<'landing' | 'login' | 'reset-password'>(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/reset-password') {
      return 'reset-password';
    }
    return 'landing';
  });

  useEffect(() => {
    // 1. Limpiar cualquier almacenamiento residual de sesiones demo previas
    localStorage.removeItem('electoral_demo_auth');

    // Limpiar tokens persistentes de Supabase en localStorage para que la sesión no quede preiniciada
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      });
    } catch {
      // ignore
    }

    // 2. Obtener sesión activa de Supabase (ahora en sessionStorage)
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (window.location.pathname === '/reset-password') {
        setPublicView('reset-password');
        setLoading(false);
        return;
      }
      if (currentSession?.user) {
        const sessionData = await buildSessionFromAuthUser(currentSession.user);
        setSession(sessionData);
      }
      setLoading(false);
    });

    // 3. Escuchar cambios de estado en Supabase Auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (event === 'PASSWORD_RECOVERY' || window.location.pathname === '/reset-password') {
        setPublicView('reset-password');
        setLoading(false);
        return;
      }
      if (currentSession?.user) {
        const sessionData = await buildSessionFromAuthUser(currentSession.user);
        setSession(sessionData);
      } else {
        setSession(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      localStorage.removeItem('electoral_demo_auth');
      sessionStorage.removeItem('electoral_superadmin_mode');
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
          }
        });
      } catch {
        // ignore
      }
      await supabase.auth.signOut();
      setSession(null);
      setPublicView('login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      sessionStorage.removeItem('electoral_superadmin_mode');
      setSession(null);
      setPublicView('login');
    }
  }, []);

  // Política de seguridad: Cierre de sesión automático por inactividad tras 60 minutos (1 hora)
  useIdleTimeout({
    timeoutMinutes: 60,
    enabled: Boolean(session),
    onTimeout: useCallback(() => {
      handleSignOut();
      setPublicView('login');
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('reason', 'session_timeout');
        window.history.replaceState({}, '', url.toString());
      } catch {
        // ignore
      }
    }, [handleSignOut]),
  });

  const handleLoginSuccess = (sessionData?: ActiveSessionData) => {
    if (sessionData) {
      setSession(sessionData);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#06080D] text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-xs font-mono tracking-wider text-slate-500 uppercase">
          Iniciando Plataforma...
        </p>
      </div>
    );
  }

  if (publicView === 'reset-password') {
    return <ResetPasswordView />;
  }

  // Si no hay sesión activa: Mostrar Landing Page pública o Login administrativo
  if (!session) {
    if (publicView === 'login') {
      return (
        <LoginPage
          onSuccess={handleLoginSuccess}
          onBackToLanding={() => setPublicView('landing')}
        />
      );
    }

    return (
      <LandingPage
        onNavigateToLogin={() => setPublicView('login')}
      />
    );
  }

  // Al autenticar, cargar el AppRouter envuelto en TenantProvider con aislamiento de datos
  return (
    <TenantProvider userRole={session.role} userTenantId={session.tenantId}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4500,
          className: '!rounded-2xl !bg-white dark:!bg-[#0d172e] !text-slate-800 dark:!text-slate-100 !border !border-slate-200/90 dark:!border-[#1e293b] !shadow-2xl !text-xs !p-3',
        }}
      />
      <AppRouter
        session={session}
        onSignOut={handleSignOut}
      />
    </TenantProvider>
  );
}
