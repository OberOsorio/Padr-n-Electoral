import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured, createNonPersistentClient } from '../../lib/supabase';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
import type { TeamMember, AppRole } from '../../types';
import { useTenant } from '../../context/TenantContext';

export const useTeamManagement = () => {
  const { currentTenantId } = useTenant();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // 1. Consultar equipo y conteo de electores por usuario para el Tenant activo
  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Modo Demostración Local o Fallback
    if (!isSupabaseConfigured) {
      if (isMountedRef.current) {
        const stored = localStorage.getItem('electoral_local_team');
        const list: TeamMember[] = stored ? JSON.parse(stored) : [];
        const scopedList = currentTenantId
          ? list.filter((m) => !m.tenant_id || m.tenant_id === currentTenantId)
          : list;

        const storedElectores = localStorage.getItem('electoral_local_electors');
        const localElectores = storedElectores ? JSON.parse(storedElectores) : [];
        const scopedElectores = currentTenantId
          ? localElectores.filter((e: any) => !e.tenant_id || e.tenant_id === currentTenantId)
          : localElectores;

        const countsMap: Record<string, number> = {};
        scopedElectores.forEach((e: any) => {
          if (e.registrado_por) {
            countsMap[e.registrado_por] = (countsMap[e.registrado_por] || 0) + 1;
          }
        });

        const formattedLocal = scopedList.map((m) => ({
          ...m,
          totalElectores: countsMap[m.id] || countsMap[m.full_name] || m.totalElectores || 0,
        }));

        setTeam(formattedLocal);
        setLoading(false);
      }
      return;
    }

    // Modo Supabase Real con Aislamiento Estricto por Tenant
    try {
      // Consultar perfiles pertenecientes al tenant activo
      let profilesQuery = supabase
        .from('profiles')
        .select('id, full_name, email, role, is_active, created_at, tenant_id')
        .order('created_at', { ascending: true });

      if (currentTenantId) {
        profilesQuery = (profilesQuery as any).eq('tenant_id', currentTenantId);
      }

      const { data: profilesData, error: profilesErr } = await profilesQuery;

      if (profilesErr) throw profilesErr;

      // Consultar electores para agregar conteo por coordinador/líder en este tenant
      let electoresQuery = (supabase.from('electores') as any).select('registrado_por, created_at');
      if (currentTenantId) {
        electoresQuery = electoresQuery.eq('tenant_id', currentTenantId);
      }

      const { data: electoresData, error: electoresErr } = await electoresQuery;

      if (electoresErr) console.error('Error al consultar electores para equipo:', electoresErr);

      // Calcular conteos y última actividad por usuario
      const countsMap: Record<string, number> = {};
      const lastActivityMap: Record<string, string> = {};

      if (electoresData) {
        (electoresData as any[]).forEach((el) => {
          if (el.registrado_por) {
            countsMap[el.registrado_por] = (countsMap[el.registrado_por] || 0) + 1;
            const currentLast = lastActivityMap[el.registrado_por];
            if (!currentLast || new Date(el.created_at) > new Date(currentLast)) {
              lastActivityMap[el.registrado_por] = el.created_at;
            }
          }
        });
      }

      // Mapa de correos registrados localmente para enriquecer
      const stored = localStorage.getItem('electoral_local_team');
      const localTeamList: TeamMember[] = stored ? JSON.parse(stored) : [];
      const localMap = new Map(localTeamList.map((m) => [m.id, m]));

      const formatted: TeamMember[] = (profilesData || []).map((p: any) => {
        const localMatch = localMap.get(p.id);
        const realEmail = p.email || localMatch?.email || '';

        return {
          id: p.id,
          full_name: p.full_name || 'Usuario del Sistema',
          email: realEmail,
          role: p.role as AppRole,
          tenant_id: p.tenant_id || currentTenantId,
          is_active: p.is_active,
          created_at: p.created_at,
          totalElectores: countsMap[p.id] || 0,
          lastActivity: lastActivityMap[p.id] || null,
        };
      });

      if (isMountedRef.current) {
        setTeam(formatted);
      }
    } catch (err: unknown) {
      console.error('Error al cargar equipo:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Error al cargar miembros del equipo.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [currentTenantId]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchTeam();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchTeam]);

  // 2. Cambiar estado activo/suspendido (Revocación inmediata)
  const toggleMemberStatus = async (id: string, currentStatus: boolean): Promise<boolean> => {
    // Blindaje de seguridad: el estado del titular / admin es inmutable desde este panel
    const targetMember = team.find((m) => m.id === id);
    if (targetMember?.role === 'admin') {
      console.warn('Operación denegada: El estado del Administrador Principal es inmutable.');
      return false;
    }

    const newStatus = !currentStatus;

    // Actualizar almacenamiento local
    try {
      const stored = localStorage.getItem('electoral_local_team');
      if (stored) {
        const list: TeamMember[] = JSON.parse(stored);
        const updated = list.map((m) =>
          m.id === id ? { ...m, is_active: newStatus } : m
        );
        localStorage.setItem('electoral_local_team', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Error al actualizar status local:', e);
    }

    if (!isSupabaseConfigured) {
      setTeam((prev) =>
        prev.map((m) => (m.id === id ? { ...m, is_active: newStatus } : m))
      );
      return true;
    }

    try {
      let updQuery = (supabase.from('profiles') as any)
        .update({ is_active: newStatus })
        .eq('id', id);

      if (currentTenantId) {
        updQuery = updQuery.eq('tenant_id', currentTenantId);
      }

      const { error: updError } = await updQuery;
      if (updError) throw updError;

      fetchTeam();
      return true;
    } catch (err) {
      console.error('Error al cambiar estado de miembro:', err);
      throw err;
    }
  };

  // 3. Cambiar rol entre 'coordinador' y 'lider'
  const changeMemberRole = async (id: string, newRole: AppRole): Promise<boolean> => {
    // Blindaje de seguridad: el rol de admin es inmutable y no se permite elevar a admin
    const targetMember = team.find((m) => m.id === id);
    if (targetMember?.role === 'admin') {
      console.warn('Operación denegada: El rol del Administrador Principal es inmutable.');
      return false;
    }
    if (newRole === 'admin') {
      console.warn('Operación denegada: No se puede asignar rol admin desde este panel.');
      return false;
    }

    try {
      const stored = localStorage.getItem('electoral_local_team');
      if (stored) {
        const list: TeamMember[] = JSON.parse(stored);
        const updated = list.map((m) =>
          m.id === id ? { ...m, role: newRole } : m
        );
        localStorage.setItem('electoral_local_team', JSON.stringify(updated));
      }
    } catch (e) {
      console.warn('Error al actualizar rol local:', e);
    }

    if (!isSupabaseConfigured) {
      setTeam((prev) =>
        prev.map((m) => (m.id === id ? { ...m, role: newRole } : m))
      );
      return true;
    }

    try {
      let roleQuery = (supabase.from('profiles') as any)
        .update({ role: newRole })
        .eq('id', id);

      if (currentTenantId) {
        roleQuery = roleQuery.eq('tenant_id', currentTenantId);
      }

      const { error: roleError } = await roleQuery;
      if (roleError) throw roleError;

      fetchTeam();
      return true;
    } catch (err) {
      console.error('Error al cambiar rol:', err);
      throw err;
    }
  };

  // 4. Crear nuevo miembro con aislamiento hermético por tenant_id
  const createMember = async (payload: {
    full_name: string;
    email: string;
    password?: string;
    role: AppRole;
  }): Promise<boolean> => {
    const trimmedEmail = payload.email.trim().toLowerCase();
    const trimmedName = payload.full_name.trim();
    const initialPassword = payload.password || 'Electoral2026*';

    let assignedId = `usr-${Date.now()}`;

    // Si Supabase está configurado, aprovisionar credencial de autenticación usando API Admin con email_confirm: true
    if (isSupabaseConfigured) {
      try {
        let userCreated = false;

        // 1. Intentar creación directa y auto-confirmada con supabaseAdmin
        if (supabaseAdmin) {
          try {
            const { data: adminData, error: adminErr } = await supabaseAdmin.auth.admin.createUser({
              email: trimmedEmail,
              password: initialPassword,
              email_confirm: true, // Acceso inmediato sin confirmación por correo
              user_metadata: {
                full_name: trimmedName,
                role: payload.role,
                tenant_id: currentTenantId,
              },
            });

            if (!adminErr && adminData?.user?.id) {
              assignedId = adminData.user.id;
              userCreated = true;
            } else if (adminErr && !adminErr.message?.toLowerCase().includes('already registered')) {
              console.warn('Aviso supabaseAdmin createUser:', adminErr.message);
            }
          } catch (admCatch) {
            console.warn('Aviso invocando supabaseAdmin:', admCatch);
          }
        }

        // 2. Si no se creó con supabaseAdmin, usar nonPersistentClient
        if (!userCreated) {
          const nonPersistentClient = createNonPersistentClient();
          const { data: signUpData, error: signUpError } = await nonPersistentClient.auth.signUp({
            email: trimmedEmail,
            password: initialPassword,
            options: {
              data: {
                full_name: trimmedName,
                role: payload.role,
                tenant_id: currentTenantId,
              },
            },
          });

          if (signUpError && !signUpError.message?.toLowerCase().includes('already registered')) {
            throw signUpError;
          }

          if (signUpData?.user?.id) {
            assignedId = signUpData.user.id;
          }
        }

        // 3. Forzar auto-confirmación en la base de datos vía RPC
        try {
          await (supabase.rpc as any)('confirmar_usuario_por_email', { p_email: trimmedEmail });
        } catch {
          // ignore
        }

        // Registrar / sincronizar el perfil con el tenant_id de la campaña
        const { error: upsertErr } = await (supabase.from('profiles') as any).upsert(
          {
            id: assignedId,
            full_name: trimmedName,
            email: trimmedEmail,
            role: payload.role,
            tenant_id: currentTenantId,
            is_active: true,
          },
          { onConflict: 'id' }
        );

        if (upsertErr) {
          console.warn('Advertencia al insertar perfil en Supabase:', upsertErr);
        }
      } catch (err) {
        console.error('Error al aprovisionar usuario en Supabase Auth:', err);
        throw err;
      }
    }

    // Respaldar en almacenamiento local
    try {
      const stored = localStorage.getItem('electoral_local_team');
      const list: TeamMember[] = stored ? JSON.parse(stored) : [];
      const newMember: TeamMember = {
        id: assignedId,
        full_name: trimmedName,
        email: trimmedEmail,
        role: payload.role,
        tenant_id: currentTenantId,
        is_active: true,
        created_at: new Date().toISOString(),
        totalElectores: 0,
        lastActivity: null,
      };

      const existingIdx = list.findIndex((m) => m.id === assignedId || m.email === trimmedEmail);
      if (existingIdx >= 0) {
        list[existingIdx] = newMember;
      } else {
        list.push(newMember);
      }
      localStorage.setItem('electoral_local_team', JSON.stringify(list));
    } catch (e) {
      console.warn('Error al guardar miembro local:', e);
    }

    await fetchTeam();
    return true;
  };

  // 5. Resetear contraseña de acceso para un miembro subordinado
  const resetMemberPassword = async (
    email: string,
    temporaryPassword?: string
  ): Promise<{ success: boolean; message: string }> => {
    const trimmedEmail = email.trim().toLowerCase();
    const targetMember = team.find((m) => m.email.trim().toLowerCase() === trimmedEmail);
    if (targetMember?.role === 'admin') {
      return {
        success: false,
        message: 'Las credenciales del Administrador Principal no pueden modificarse desde este panel.',
      };
    }

    const tempPass = temporaryPassword || 'Electoral2026*';

    if (isSupabaseConfigured) {
      try {
        const resetRedirect = typeof window !== 'undefined' ? `${window.location.origin}` : '';
        await supabase.auth.resetPasswordForEmail(trimmedEmail, {
          redirectTo: resetRedirect,
        });
      } catch (err) {
        console.warn('Aviso al solicitar reset por email en Supabase:', err);
      }
    }

    return {
      success: true,
      message: `Acceso reseteado exitosamente para ${trimmedEmail}. Clave provisional sugerida: ${tempPass}`,
    };
  };

  return {
    team,
    loading,
    error,
    toggleMemberStatus,
    changeMemberRole,
    createMember,
    resetMemberPassword,
    refetch: fetchTeam,
  };
};
