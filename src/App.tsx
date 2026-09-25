import { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabase';
import type { Profile, ActiveSessionData } from './types';
import { LoginPage } from './modules/auth/LoginPage';
import { LandingPage } from './modules/public/LandingPage';
import { AppRouter } from './routes/AppRouter';
import { TenantProvider } from './context/TenantContext';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { Loader2 } from 'lucide-react';

async function buildSessionFromAuthUser(authUser: any): Promise<ActiveSessionData> {
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  const profile = profileData as Profile | null;

  const userRole = (
    profile?.role ||
    authUser.user_metadata?.role ||
    'admin'
  ).toLowerCase();

  const userName =
    profile?.full_name ||
    authUser.user_metadata?.full_name ||
    authUser.email?.split('@')[0] ||
    'Usuario del Sistema';

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
  const [publicView, setPublicView] = useState<'landing' | 'login'>('landing');

  useEffect(() => {
    // 1. Limpiar cualquier almacenamiento residual de sesiones y datos demo previos
    localStorage.removeItem('electoral_demo_auth');
    localStorage.removeItem('electoral_saas_tenants');
    localStorage.removeItem('electoral_local_electors');
    localStorage.removeItem('electoral_local_team');
    localStorage.removeItem('electoral_saas_access_logs');
    localStorage.removeItem('electoral_active_tenant_id');

    // 2. Obtener sesión activa de Supabase
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (currentSession?.user) {
        const sessionData = await buildSessionFromAuthUser(currentSession.user);
        setSession(sessionData);
      }
      setLoading(false);
    });

    // 3. Escuchar cambios de estado en Supabase Auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
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
      await supabase.auth.signOut();
      setSession(null);
      setPublicView('login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
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
      <AppRouter
        session={session}
        onSignOut={handleSignOut}
      />
    </TenantProvider>
  );
}
