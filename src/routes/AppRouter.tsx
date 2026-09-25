import React, { useState } from 'react';
import { useTenant } from '../context/TenantContext';
import { MasterPlatformLayout } from '../components/layout/MasterPlatformLayout';
import { AppLayout } from '../components/layout/AppLayout';
import { SuspendedTenantScreen } from '../components/common/SuspendedTenantScreen';
import { LeaderWorkspaceView } from '../modules/leader/LeaderWorkspaceView';
import { SuperAdminGatewayModal } from '../modules/auth/SuperAdminGatewayModal';

import type { ActiveSessionData } from '../types';
export type { ActiveSessionData };

interface AppRouterProps {
  session: ActiveSessionData;
  onSignOut: () => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({ session, onSignOut }) => {
  const { tenants, currentTenant, setCurrentTenantId } = useTenant();

  const userRole = (session.role || 'admin').toLowerCase();

  // Estado del entorno para SuperAdmin: 'gateway' | 'master' | 'campaign_preview'
  const [superAdminMode, setSuperAdminMode] = useState<'gateway' | 'master' | 'campaign_preview'>(() => {
    const saved = sessionStorage.getItem('electoral_superadmin_mode');
    if (saved === 'master' || saved === 'campaign_preview') {
      return saved;
    }
    return 'gateway';
  });

  // 1. RUTA SUPERADMIN: Gateway Selector inteligente y navegación entre entornos
  if (userRole === 'superadmin') {
    if (superAdminMode === 'gateway') {
      return (
        <div className="h-[100dvh] w-full bg-[#06080D] relative flex items-center justify-center overflow-hidden">
          <SuperAdminGatewayModal
            isOpen={true}
            onSelectMaster={() => {
              setSuperAdminMode('master');
              sessionStorage.setItem('electoral_superadmin_mode', 'master');
            }}
            onSelectCampaign={(tenantId) => {
              if (tenantId) {
                setCurrentTenantId(tenantId);
              }
              setSuperAdminMode('campaign_preview');
              sessionStorage.setItem('electoral_superadmin_mode', 'campaign_preview');
            }}
            onSignOut={() => {
              sessionStorage.removeItem('electoral_superadmin_mode');
              onSignOut();
            }}
            tenants={tenants}
            currentTenantId={currentTenant?.id || null}
            adminEmail={session.email}
          />
        </div>
      );
    }

    if (superAdminMode === 'campaign_preview') {
      return (
        <AppLayout
          userEmail={session.email}
          userName={`${session.userName || 'SuperAdmin'} (Sandbox)`}
          userRole="admin"
          isSuperAdminInspection={true}
          onBackToMasterPlatform={() => {
            setSuperAdminMode('master');
            sessionStorage.setItem('electoral_superadmin_mode', 'master');
          }}
          onOpenGateway={() => {
            setSuperAdminMode('gateway');
            sessionStorage.removeItem('electoral_superadmin_mode');
          }}
          onSignOut={() => {
            sessionStorage.removeItem('electoral_superadmin_mode');
            onSignOut();
          }}
        />
      );
    }

    // Por defecto en modo 'master'
    return (
      <MasterPlatformLayout
        userName={session.userName}
        userEmail={session.email}
        onSignOut={() => {
          sessionStorage.removeItem('electoral_superadmin_mode');
          onSignOut();
        }}
        onOpenGateway={() => {
          setSuperAdminMode('gateway');
          sessionStorage.removeItem('electoral_superadmin_mode');
        }}
      />
    );
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
