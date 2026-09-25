import React from 'react';
import { useTenant } from '../context/TenantContext';
import { MasterPlatformLayout } from '../components/layout/MasterPlatformLayout';
import { AppLayout } from '../components/layout/AppLayout';
import { SuspendedTenantScreen } from '../components/common/SuspendedTenantScreen';
import { LeaderWorkspaceView } from '../modules/leader/LeaderWorkspaceView';

export interface ActiveSessionData {
  email: string;
  id: string;
  userName?: string;
  role?: string;
  tenantId?: string | null;
  isDemo?: boolean;
}

interface AppRouterProps {
  session: ActiveSessionData;
  onSignOut: () => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({ session, onSignOut }) => {
  const { tenants, currentTenant } = useTenant();

  const userRole = (session.role || 'admin').toLowerCase();

  // 1. RUTA SUPERADMIN: Exclusivamente MasterPlatformLayout
  if (userRole === 'superadmin') {
    return <MasterPlatformLayout onSignOut={onSignOut} />;
  }

  // 2. RUTA CAMPAÑA: Verificar si el tenant está suspendido
  const userTenant =
    (session.tenantId ? tenants.find((t) => t.id === session.tenantId) : null) ||
    currentTenant;

  if (userTenant && !userTenant.is_active) {
    return (
      <SuspendedTenantScreen
        tenantName={userTenant.name}
        onSignOut={onSignOut}
      />
    );
  }

  // 3. RUTA LÍDER EN TERRENO: Entorno Mobile-First personal y aislado
  if (userRole === 'lider') {
    return (
      <LeaderWorkspaceView
        userId={session.id}
        userName={session.userName || 'Líder Comunitario'}
        userEmail={session.email}
        tenantId={session.tenantId ?? null}
        tenantName={userTenant?.name}
        onSignOut={onSignOut}
      />
    );
  }

  // 4. RUTA DIRECTIVA / COORDINACIÓN: Renderizar entorno integral de campaña electoral
  return (
    <AppLayout
      userEmail={session.email}
      userName={session.userName || 'Usuario de Campaña'}
      userRole={session.role || 'admin'}
      onSignOut={onSignOut}
    />
  );
};
