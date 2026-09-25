import { useEffect, useState, useCallback } from 'react';
import { supabase } from './lib/supabase';
import type { Profile } from './types';
import { LoginPage } from './modules/auth/LoginPage';
import { LandingPage } from './modules/public/LandingPage';
import { AppRouter } from './routes/AppRouter';
import { TenantProvider } from './context/TenantContext';
import { useIdleTimeout } from './hooks/useIdleTimeout';
import { Loader2 } from 'lucide-react';

interface ActiveSessionData {
  email: string;
  id: string;
  userName?: string;
  role?: string;
  tenantId?: string | null;
  isDemo?: boolean;
}

export default function App() {
  const [session, setSession] = useState<ActiveSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [publicView, setPublicView] = useState<'landing' | 'login'>('landing');

  useEffect(() => {
    // 1. Revisar si hay sesión demo en localStorage
    const savedDemo = localStorage.getItem('electoral_demo_auth');
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        if (parsed?.user?.email) {
          setSession({
            email: parsed.user.email,
            id: parsed.user.id || 'usr_admin_001_master',
            userName: parsed.user.user_metadata?.full_name || 'Administrador General',
            role: parsed.user.role || 'Admin',
            tenantId: parsed.user.tenant_id || 'ten_alcaldia_2027',
            isDemo: true,
          });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error al leer sesión demo:', err);
      }
    }

    // 2. Obtener sesión de Supabase
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (currentSession?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .maybeSingle();

        const profile = data as Profile | null;

        setSession({
          email: currentSession.user.email || 'admin@electoral.gov',
          id: currentSession.user.id,
          userName: profile?.full_name || 'Usuario del Sistema',
          role: profile?.role || 'admin',
          tenantId: profile?.tenant_id || null,
          isDemo: false,
        });
      }
      setLoading(false);
    });

    // 3. Escuchar cambios de estado en Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (currentSession?.user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .maybeSingle();

        const profile = data as Profile | null;

        setSession({
          email: currentSession.user.email || 'admin@electoral.gov',
          id: currentSession.user.id,
          userName: profile?.full_name || 'Usuario del Sistema',
          role: profile?.role || 'admin',
          tenantId: profile?.tenant_id || null,
          isDemo: false,
        });
      } else if (!localStorage.getItem('electoral_demo_auth')) {
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
      setPublicView('landing');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setSession(null);
      setPublicView('landing');
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

  const handleLoginSuccess = (email?: string) => {
    const savedDemo = localStorage.getItem('electoral_demo_auth');
    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        if (parsed?.user) {
          setSession({
            email: parsed.user.email || email || 'admin@alcaldia2027.gov',
            id: parsed.user.id || 'usr_admin_001_master',
            userName: parsed.user.user_metadata?.full_name || 'Usuario del Sistema',
            role: parsed.user.role || 'admin',
            tenantId: parsed.user.tenant_id ?? null,
            isDemo: true,
          });
          return;
        }
      } catch (e) {
        console.error('Error reading saved demo auth on success:', e);
      }
    }

    setSession({
      email: email || 'admin@alcaldia2027.gov',
      id: 'usr_admin_001_master',
      userName: 'Director Campaña Alcaldía 2027',
      role: 'admin',
      tenantId: 'ten_alcaldia_2027',
      isDemo: true,
    });
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
