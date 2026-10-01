import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, createNonPersistentClient } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';

export interface UserNode {
  id: string;
  full_name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'candidato' | 'coordinador' | 'lider';
  tenant_id: string;
  tenant_name?: string;
  parent_id?: string | null;
  electores_count: number;
  is_active: boolean;
  children?: UserNode[];
}

export interface TenantTreeGroup {
  tenantId: string;
  tenantName: string;
  municipio: string;
  directores: UserNode[];
  totalUsuarios: number;
  totalElectores: number;
}

export function useUsersTree() {
  const [treeData, setTreeData] = useState<TenantTreeGroup[]>([]);
  const [allUsersList, setAllUsersList] = useState<UserNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTree = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Obtener campañas (Tenants)
      let tenantsList: any[] = [];
      if (isSupabaseConfigured) {
        const { data: tenants, error: errTenants } = await (supabase.from('tenants') as any)
          .select('id, name, municipio, departamento, is_active')
          .order('name');
        if (!errTenants && tenants) {
          tenantsList = tenants;
        }
      }

      // Si no hay tenants o hubo fallback local
      if (tenantsList.length === 0) {
        try {
          const stored = localStorage.getItem('electoral_local_tenants');
          if (stored) tenantsList = JSON.parse(stored);
        } catch (e) {
          console.warn('Aviso leyendo tenants locales:', e);
        }
      }

      // 2. Obtener perfiles de usuarios (Profiles)
      let profilesList: any[] = [];
      if (isSupabaseConfigured) {
        const client = supabaseAdmin || supabase;
        const { data: profiles, error: errProfiles } = await (client.from('profiles') as any)
          .select('id, full_name, email, role, tenant_id, parent_id, is_active, meta_electores');
        if (!errProfiles && profiles) {
          profilesList = profiles;
        }
      }

      // Enriquecer con perfiles locales (localStorage)
      try {
        const storedTeam = localStorage.getItem('electoral_local_team');
        if (storedTeam) {
          const localTeam = JSON.parse(storedTeam);
          localTeam.forEach((lt: any) => {
            if (!profilesList.some((p) => p.id === lt.id || (p.email && p.email === lt.email))) {
              profilesList.push({
                id: lt.id,
                full_name: lt.full_name,
                email: lt.email,
                role: lt.role || 'lider',
                tenant_id: lt.tenant_id,
                parent_id: lt.parent_id || null,
                is_active: lt.is_active ?? true,
                meta_electores: lt.meta_electores || 100,
              });
            }
          });
        }
      } catch (e) {
        console.warn('Aviso fusionando equipo local:', e);
      }

      // 3. Obtener conteo de electores por usuario (registrado_por) y por tenant
      const electoresCountMap: Record<string, number> = {};
      const tenantElectoresCountMap: Record<string, number> = {};

      if (isSupabaseConfigured) {
        try {
          const { data: electoresData } = await (supabase.from('electores') as any)
            .select('registrado_por, tenant_id');
          if (electoresData) {
            (electoresData as any[]).forEach((el) => {
              if (el.registrado_por) {
                electoresCountMap[el.registrado_por] = (electoresCountMap[el.registrado_por] || 0) + 1;
              }
              if (el.tenant_id) {
                tenantElectoresCountMap[el.tenant_id] = (tenantElectoresCountMap[el.tenant_id] || 0) + 1;
              }
            });
          }
        } catch (e) {
          console.warn('Aviso consultando conteo de electores:', e);
        }
      }

      // También contar electores locales
      try {
        const storedElectores = localStorage.getItem('electoral_local_electors');
        if (storedElectores) {
          const localElectores = JSON.parse(storedElectores);
          localElectores.forEach((el: any) => {
            if (el.registrado_por) {
              electoresCountMap[el.registrado_por] = (electoresCountMap[el.registrado_por] || 0) + 1;
            }
            if (el.tenant_id) {
              tenantElectoresCountMap[el.tenant_id] = (tenantElectoresCountMap[el.tenant_id] || 0) + 1;
            }
          });
        }
      } catch (e) {
        console.warn('Aviso leyendo electores locales:', e);
      }

      // 4. Construir estructura jerárquica por Campaña
      const flatUsers: UserNode[] = [];

      const grupos: TenantTreeGroup[] = tenantsList.map((t) => {
        // Miembros de esta campaña
        const miembros = profilesList
          .filter((p) => p.tenant_id === t.id)
          .map((p) => {
            const node: UserNode = {
              id: p.id,
              full_name: p.full_name || 'Sin Nombre',
              email: p.email || '',
              role: p.role,
              tenant_id: p.tenant_id,
              tenant_name: t.name,
              parent_id: p.parent_id || null,
              electores_count: electoresCountMap[p.id] || 0,
              is_active: p.is_active ?? true,
              children: [],
            };
            flatUsers.push(node);
            return node;
          });

        // Mapear nodos para ensamblar parent-children
        const nodoMap = new Map<string, UserNode>();
        miembros.forEach((m) => nodoMap.set(m.id, { ...m, children: [] }));

        const directores: UserNode[] = [];

        miembros.forEach((m) => {
          const nodo = nodoMap.get(m.id)!;
          // Si es rol de mayor jerarquía o no tiene parent_id asignado en este tenant
          if (m.role === 'admin' || m.role === 'candidato' || !m.parent_id || !nodoMap.has(m.parent_id)) {
            directores.push(nodo);
          } else {
            const padre = nodoMap.get(m.parent_id);
            if (padre) {
              padre.children = padre.children || [];
              padre.children.push(nodo);
            } else {
              directores.push(nodo);
            }
          }
        });

        // Ordenar directores: admins/candidatos primero, luego por nombre
        directores.sort((a, b) => {
          const roleWeight: Record<string, number> = { admin: 1, candidato: 2, coordinador: 3, lider: 4, superadmin: 0 };
          const weightDiff = (roleWeight[a.role] || 99) - (roleWeight[b.role] || 99);
          if (weightDiff !== 0) return weightDiff;
          return a.full_name.localeCompare(b.full_name, 'es');
        });

        return {
          tenantId: t.id,
          tenantName: t.name,
          municipio: t.municipio ? `${t.municipio}${t.departamento ? ', ' + t.departamento : ''}` : 'Colombia',
          directores,
          totalUsuarios: miembros.length,
          totalElectores: tenantElectoresCountMap[t.id] || 0,
        };
      });

      setTreeData(grupos);
      setAllUsersList(flatUsers);
    } catch (err: any) {
      console.error('Error cargando estructura de usuarios:', err);
      setError(err.message || 'Error al cargar estructura.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // Cambiar estado activo / suspendido
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      if (isSupabaseConfigured) {
        const client = supabaseAdmin || supabase;
        await (client.from('profiles') as any)
          .update({ is_active: newStatus })
          .eq('id', userId);
      }

      // Actualizar localStorage
      try {
        const storedTeam = localStorage.getItem('electoral_local_team');
        if (storedTeam) {
          const list = JSON.parse(storedTeam);
          const updated = list.map((m: any) => (m.id === userId ? { ...m, is_active: newStatus } : m));
          localStorage.setItem('electoral_local_team', JSON.stringify(updated));
        }
      } catch (e) {
        // ignore
      }

      await fetchTree();
      return { success: true };
    } catch (err: any) {
      console.error('Error al actualizar estado:', err);
      return { success: false, error: err.message };
    }
  };

  // Crear nuevo usuario en la jerarquía
  const createUser = async (params: {
    fullName: string;
    email: string;
    password?: string;
    role: 'admin' | 'candidato' | 'coordinador' | 'lider';
    tenantId: string;
    parentId?: string | null;
  }) => {
    try {
      const cleanEmail = params.email.trim().toLowerCase();
      const cleanName = params.fullName.trim();
      const initialPass = params.password || 'Campana2026*';
      let assignedId = crypto.randomUUID ? crypto.randomUUID() : `usr_${Date.now()}`;

      if (isSupabaseConfigured) {
        let userCreated = false;
        if (supabaseAdmin) {
          try {
            const { data: adminData, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
              email: cleanEmail,
              password: initialPass,
              email_confirm: true,
              user_metadata: {
                full_name: cleanName,
                role: params.role,
                tenant_id: params.tenantId,
              },
            });
            if (!adminErr && adminData?.user?.id) {
              assignedId = adminData.user.id;
              userCreated = true;
            }
          } catch (admCatch) {
            console.warn('Aviso supabaseAdmin createUser:', admCatch);
          }
        }

        if (!userCreated) {
          const nonPersistentClient = createNonPersistentClient();
          const { data: signUpData } = await nonPersistentClient.auth.signUp({
            email: cleanEmail,
            password: initialPass,
            options: {
              data: {
                full_name: cleanName,
                role: params.role,
                tenant_id: params.tenantId,
              },
            },
          });
          if (signUpData?.user?.id) {
            assignedId = signUpData.user.id;
          }
        }

        try {
          await (supabase.rpc as any)('confirmar_usuario_por_email', { p_email: cleanEmail });
        } catch {
          // ignore
        }

        const client = supabaseAdmin || supabase;
        await (client.from('profiles') as any).upsert({
          id: assignedId,
          full_name: cleanName,
          email: cleanEmail,
          role: params.role,
          tenant_id: params.tenantId,
          parent_id: params.parentId || null,
          is_active: true,
        });
      }

      // Persistencia local
      try {
        const storedTeam = localStorage.getItem('electoral_local_team');
        const teamList = storedTeam ? JSON.parse(storedTeam) : [];
        teamList.unshift({
          id: assignedId,
          full_name: cleanName,
          email: cleanEmail,
          role: params.role,
          tenant_id: params.tenantId,
          parent_id: params.parentId || null,
          is_active: true,
          created_at: new Date().toISOString(),
          totalElectores: 0,
        });
        localStorage.setItem('electoral_local_team', JSON.stringify(teamList));
      } catch (e) {
        // ignore
      }

      await fetchTree();
      return { success: true };
    } catch (err: any) {
      console.error('Error creando usuario:', err);
      return { success: false, error: err.message || 'Error al crear usuario' };
    }
  };

  return {
    treeData,
    allUsersList,
    loading,
    error,
    refetch: fetchTree,
    toggleUserStatus,
    createUser,
  };
}
