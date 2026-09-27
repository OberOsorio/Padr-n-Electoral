import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured, createNonPersistentClient } from '../lib/supabase';
import type { Tenant, TenantPlan } from '../types';

export const DEFAULT_TENANTS: Tenant[] = [];

const LOCAL_STORAGE_TENANTS_KEY = 'electoral_saas_tenants';
const LOCAL_STORAGE_ACTIVE_TENANT_KEY = 'electoral_active_tenant_id';

interface PlanUsage {
  totalElectors: number;
  maxElectors: number;
  percentage: number;
  isNearLimit: boolean;
  isLimitReached: boolean;
}

interface CreateCampaignParams {
  name: string;
  slug: string;
  plan?: TenantPlan | string;
  max_electors?: number;
  departamento?: string;
  municipio?: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  currentTenantId: string | null;
  setCurrentTenantId: (id: string | null) => void;
  createTenant: (tenantData: {
    name: string;
    slug: string;
    plan?: TenantPlan | string;
    max_electors?: number;
    departamento?: string;
    municipio?: string;
  }) => Promise<Tenant>;
  createCampaignWithAdmin: (params: CreateCampaignParams) => Promise<Tenant>;
  updateTenant: (id: string, updates: Partial<Tenant>) => Promise<void>;
  toggleTenantStatus: (id: string) => Promise<void>;
  deleteTenantPermanently: (id: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  loading: boolean;
  planUsage: PlanUsage;
  refetchTenants: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode; userRole?: string; userTenantId?: string | null }> = ({
  children,
  userRole: _userRole,
  userTenantId,
}) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenantId, setCurrentTenantIdState] = useState<string | null>(null);
  const [totalTenantElectors, setTotalTenantElectors] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // 1. Cargar lista de Tenants
  const fetchTenants = useCallback(async () => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      setTenants([]);
      setCurrentTenantIdState(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase.from('tenants') as any)
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const loadedTenants: Tenant[] = data || [];

      if (loadedTenants.length === 0) {
        setTenants([]);
        setCurrentTenantIdState(null);
        localStorage.removeItem(LOCAL_STORAGE_ACTIVE_TENANT_KEY);
        localStorage.removeItem(LOCAL_STORAGE_TENANTS_KEY);
      } else {
        setTenants(loadedTenants);
        const savedTenantId = localStorage.getItem(LOCAL_STORAGE_ACTIVE_TENANT_KEY);
        const activeId = userTenantId || savedTenantId || loadedTenants[0]?.id || null;
        setCurrentTenantIdState(activeId);
      }
    } catch (err) {
      console.warn('Error al consultar tenants de Supabase:', err);
      setTenants([]);
      setCurrentTenantIdState(null);
    } finally {
      setLoading(false);
    }
  }, [userTenantId]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Cambiar tenant activo
  const setCurrentTenantId = useCallback((id: string | null) => {
    setCurrentTenantIdState(id);
    if (id) {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_TENANT_KEY, id);
    } else {
      localStorage.removeItem(LOCAL_STORAGE_ACTIVE_TENANT_KEY);
    }
  }, []);

  // Tenant actualmente seleccionado
  const currentTenant = useMemo(() => {
    return tenants.find((t) => t.id === currentTenantId) || tenants[0] || null;
  }, [tenants, currentTenantId]);

  // 2. Consultar uso de censo electoral para el Tenant activo
  useEffect(() => {
    if (!currentTenant?.id) return;

    const countElectors = async () => {
      if (!isSupabaseConfigured) {
        const stored = localStorage.getItem('electoral_local_electors');
        const list = stored ? JSON.parse(stored) : [];
        const count = list.filter((e: any) => !e.tenant_id || e.tenant_id === currentTenant.id).length;
        setTotalTenantElectors(count);
        return;
      }

      try {
        const { count, error } = await (supabase.from('electores') as any)
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', currentTenant.id);

        if (!error && count !== null) {
          setTotalTenantElectors(count);
        }
      } catch (err) {
        console.warn('Error al consultar electores del tenant:', err);
      }
    };

    countElectors();
  }, [currentTenant?.id]);

  // 3. Crear nuevo Tenant (Campaña con capacidad ilimitada)
  const createTenant = async (tenantData: {
    name: string;
    slug: string;
    plan?: TenantPlan | string;
    max_electors?: number;
    departamento?: string;
    municipio?: string;
  }): Promise<Tenant> => {
    const newTenant: Tenant = {
      id: crypto.randomUUID ? crypto.randomUUID() : `ten_${Date.now()}`,
      name: tenantData.name,
      slug: tenantData.slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-'),
      es_ilimitado: true,
      departamento: tenantData.departamento,
      municipio: tenantData.municipio,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    // Actualizar estado local
    setTenants((prev) => {
      const updated = [...prev, newTenant];
      localStorage.setItem(LOCAL_STORAGE_TENANTS_KEY, JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        const { error } = await (supabase.from('tenants') as any).insert({
          id: newTenant.id,
          name: newTenant.name,
          slug: newTenant.slug,
          es_ilimitado: true,
          departamento: newTenant.departamento,
          municipio: newTenant.municipio,
          is_active: newTenant.is_active,
        });
        if (error) console.error('Error insertando tenant en Supabase:', error);
      } catch (err) {
        console.error('Error al persistir tenant en Supabase:', err);
      }
    }

    return newTenant;
  };

  // 4. Crear Campaña con Administrador asignado (Capacidad Ilimitada)
  const createCampaignWithAdmin = async (params: CreateCampaignParams): Promise<Tenant> => {
    const tempTenantId = `ten_${Date.now()}`;
    let effectiveTenantId = tempTenantId;

    const newTenant: Tenant = {
      id: tempTenantId,
      name: params.name,
      slug: params.slug.toLowerCase().trim().replace(/[^a-z0-9-]+/g, '-'),
      es_ilimitado: true,
      departamento: params.departamento,
      municipio: params.municipio,
      is_active: true,
      created_at: new Date().toISOString(),
      admin_name: params.adminName,
      admin_email: params.adminEmail,
      totalElectores: 0,
      totalUsers: 1,
    };

    if (isSupabaseConfigured) {
      try {
        // Intentar invocar función RPC aprovisionar_nueva_campana
        const { data: rpcRes, error: rpcErr } = await (supabase.rpc as any)('aprovisionar_nueva_campana', {
          p_nombre: params.name,
          p_slug: newTenant.slug,
          p_departamento: params.departamento || null,
          p_municipio: params.municipio || null,
          p_admin_nombre: params.adminName,
          p_admin_email: params.adminEmail,
          p_admin_password: params.adminPassword,
        });

        if (!rpcErr && rpcRes?.tenant_id) {
          effectiveTenantId = rpcRes.tenant_id;
          newTenant.id = effectiveTenantId;
        } else {
          // Inserción directa en tabla tenants como fallback
          const { error: insErr } = await (supabase.from('tenants') as any).insert({
            id: newTenant.id,
            name: newTenant.name,
            slug: newTenant.slug,
            es_ilimitado: true,
            departamento: params.departamento || null,
            municipio: params.municipio || null,
            is_active: true,
          });
          if (insErr) console.warn('Aviso insertando tenant:', insErr);
        }

        // Aprovisionar administrador en Supabase Auth con cliente sin persistencia
        let adminAuthId = `usr_${effectiveTenantId}_admin`;
        try {
          const nonPersistentClient = createNonPersistentClient();
          const { data: signUpData, error: signUpErr } = await nonPersistentClient.auth.signUp({
            email: params.adminEmail.trim().toLowerCase(),
            password: params.adminPassword,
            options: {
              data: {
                full_name: params.adminName.trim(),
                role: 'admin',
                tenant_id: effectiveTenantId,
              },
            },
          });
          if (!signUpErr && signUpData?.user?.id) {
            adminAuthId = signUpData.user.id;
          }
        } catch (authErr) {
          console.warn('Aviso aprovisionando admin en Auth:', authErr);
        }

        // Registrar / actualizar el perfil en la tabla profiles
        await (supabase.from('profiles') as any).upsert({
          id: adminAuthId,
          full_name: params.adminName.trim(),
          role: 'admin',
          tenant_id: effectiveTenantId,
          is_active: true,
        });
      } catch (err) {
        console.error('Error persistiendo campaña y administrador en Supabase:', err);
      }
    }

    // Actualizar tenants localmente
    setTenants((prev) => {
      const updated = [newTenant, ...prev.filter((t) => t.id !== newTenant.id)];
      localStorage.setItem(LOCAL_STORAGE_TENANTS_KEY, JSON.stringify(updated));
      return updated;
    });

    // Registrar perfil demo del administrador para permitir su inicio de sesión inmediato
    try {
      const storedTeam = localStorage.getItem('electoral_local_team');
      const teamList = storedTeam ? JSON.parse(storedTeam) : [];
      teamList.unshift({
        id: `usr_${effectiveTenantId}_admin`,
        full_name: params.adminName,
        email: params.adminEmail,
        role: 'admin',
        tenant_id: effectiveTenantId,
        is_active: true,
        created_at: new Date().toISOString(),
        totalElectores: 0,
        lastActivity: new Date().toISOString(),
      });
      localStorage.setItem('electoral_local_team', JSON.stringify(teamList));
    } catch (e) {
      console.warn('Error al respaldar admin local:', e);
    }

    return newTenant;
  };

  // 4. Actualizar Tenant
  const updateTenant = async (id: string, updates: Partial<Tenant>) => {
    setTenants((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      localStorage.setItem(LOCAL_STORAGE_TENANTS_KEY, JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured) {
      try {
        await (supabase.from('tenants') as any).update(updates).eq('id', id);
      } catch (err) {
        console.error('Error actualizando tenant en Supabase:', err);
      }
    }
  };

  // 5. Alternar estado activo / suspendido
  const toggleTenantStatus = async (id: string) => {
    const target = tenants.find((t) => t.id === id);
    if (!target) return;
    await updateTenant(id, { is_active: !target.is_active });
  };

  // 6. Eliminar Campaña Definitivamente (Acción Destructiva Hermética con RPC en Supabase)
  const deleteTenantPermanently = async (id: string): Promise<{ success: boolean; message?: string; error?: string }> => {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await (supabase.rpc as any)('eliminar_tenant_critico', {
          p_tenant_id: id,
        });

        if (error) {
          console.error('Error al invocar eliminar_tenant_critico en Supabase:', error);
          const { error: delErr } = await (supabase.from('tenants') as any).delete().eq('id', id);
          if (delErr) {
            return { success: false, error: delErr.message };
          }
        } else if (data && data.success === false) {
          return { success: false, error: data.error };
        }
      } catch (err: any) {
        console.error('Excepción al eliminar tenant en Supabase:', err);
        return { success: false, error: err.message };
      }
    }

    // Actualizar estado local reactivo
    setTenants((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      localStorage.setItem(LOCAL_STORAGE_TENANTS_KEY, JSON.stringify(updated));
      return updated;
    });

    // Limpiar electores y equipo local asociados al tenant
    try {
      const storedElectors = localStorage.getItem('electoral_local_electors');
      if (storedElectors) {
        const electors = JSON.parse(storedElectors);
        const filtered = electors.filter((e: any) => e.tenant_id !== id);
        localStorage.setItem('electoral_local_electors', JSON.stringify(filtered));
      }

      const storedTeam = localStorage.getItem('electoral_local_team');
      if (storedTeam) {
        const team = JSON.parse(storedTeam);
        const filtered = team.filter((m: any) => m.tenant_id !== id);
        localStorage.setItem('electoral_local_team', JSON.stringify(filtered));
      }
    } catch (e) {
      console.warn('Aviso limpiando localStorage tras borrado de campaña:', e);
    }

    if (currentTenantId === id) {
      const remaining = tenants.filter((t) => t.id !== id);
      const nextId = remaining.length > 0 ? remaining[0].id : null;
      setCurrentTenantId(nextId);
    }

    return { success: true };
  };

  // 7. Capacidad del padrón (Modelo Ilimitado)
  const planUsage: PlanUsage = useMemo(() => {
    return {
      totalElectors: totalTenantElectors,
      maxElectors: 0,
      percentage: 0,
      isNearLimit: false,
      isLimitReached: false,
    };
  }, [totalTenantElectors]);

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        tenants,
        currentTenantId,
        setCurrentTenantId,
        createTenant,
        createCampaignWithAdmin,
        updateTenant,
        toggleTenantStatus,
        deleteTenantPermanently,
        loading,
        planUsage,
        refetchTenants: fetchTenants,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant debe ser utilizado dentro de un TenantProvider');
  }
  return context;
};
