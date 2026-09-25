import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { TeamMember, AppRole } from '../../types';

const INITIAL_DEMO_TEAM: TeamMember[] = [
  {
    id: 'cdor-1',
    full_name: 'Javier Rivas Caicedo',
    email: 'javier.rivas@electoral.gov',
    role: 'coordinador',
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    totalElectores: 742,
    lastActivity: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'cdor-2',
    full_name: 'Patricia Gómez Herrera',
    email: 'patricia.gomez@electoral.gov',
    role: 'coordinador',
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    totalElectores: 618,
    lastActivity: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: 'cdor-3',
    full_name: 'Manuel Antonio Rojas',
    email: 'manuel.rojas@electoral.gov',
    role: 'coordinador',
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
    totalElectores: 435,
    lastActivity: new Date(Date.now() - 1000 * 60 * 125).toISOString(),
  },
  {
    id: 'usr_admin_001_master',
    full_name: 'Administrador General',
    email: 'admin@electoral.gov',
    role: 'admin',
    is_active: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
    totalElectores: 1625,
    lastActivity: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'cdor-4',
    full_name: 'Carlos Alberto Vega',
    email: 'carlos.vega@electoral.gov',
    role: 'coordinador',
    is_active: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    totalElectores: 0,
    lastActivity: null,
  },
];

export const useTeamManagement = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // 1. Consultar equipo y conteo de electores por usuario
  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Modo Demostración Local
    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('electoral_local_team');
      const list: TeamMember[] = stored ? JSON.parse(stored) : INITIAL_DEMO_TEAM;
      if (!stored) {
        localStorage.setItem('electoral_local_team', JSON.stringify(INITIAL_DEMO_TEAM));
      }

      if (isMountedRef.current) {
        setTeam(list);
        setLoading(false);
      }
      return;
    }

    // Modo Supabase Real
    try {
      // Consultar todos los perfiles
      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, full_name, role, is_active, created_at')
        .order('created_at', { ascending: true });

      if (profilesErr) throw profilesErr;

      // Consultar electores para agregar conteo por coordinador
      const { data: electoresData, error: electoresErr } = await (
        supabase.from('electores') as any
      ).select('registrado_por, created_at');

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

      const formatted: TeamMember[] = (profilesData || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name || 'Usuario del Sistema',
        email: p.full_name ? `${p.full_name.toLowerCase().replace(/\s+/g, '.')}@electoral.gov` : 'usuario@electoral.gov',
        role: p.role as AppRole,
        is_active: p.is_active,
        created_at: p.created_at,
        totalElectores: countsMap[p.id] || 0,
        lastActivity: lastActivityMap[p.id] || null,
      }));

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
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchTeam();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchTeam]);

  // 2. Cambiar estado activo/inactivo (Revocación inmediata)
  const toggleMemberStatus = async (id: string, currentStatus: boolean): Promise<boolean> => {
    const newStatus = !currentStatus;

    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('electoral_local_team');
      const list: TeamMember[] = stored ? JSON.parse(stored) : INITIAL_DEMO_TEAM;
      const updated = list.map((m) =>
        m.id === id ? { ...m, is_active: newStatus } : m
      );
      localStorage.setItem('electoral_local_team', JSON.stringify(updated));
      setTeam(updated);
      return true;
    }

    try {
      const { error: updError } = await (supabase.from('profiles') as any)
        .update({ is_active: newStatus })
        .eq('id', id);

      if (updError) throw updError;

      fetchTeam();
      return true;
    } catch (err) {
      console.error('Error al cambiar estado de miembro:', err);
      throw err;
    }
  };

  // 3. Cambiar rol entre 'admin' y 'coordinador'
  const changeMemberRole = async (id: string, newRole: AppRole): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('electoral_local_team');
      const list: TeamMember[] = stored ? JSON.parse(stored) : INITIAL_DEMO_TEAM;
      const updated = list.map((m) =>
        m.id === id ? { ...m, role: newRole } : m
      );
      localStorage.setItem('electoral_local_team', JSON.stringify(updated));
      setTeam(updated);
      return true;
    }

    try {
      const { error: roleError } = await (supabase.from('profiles') as any)
        .update({ role: newRole })
        .eq('id', id);

      if (roleError) throw roleError;

      fetchTeam();
      return true;
    } catch (err) {
      console.error('Error al cambiar rol:', err);
      throw err;
    }
  };

  // 4. Crear o invitar nuevo miembro
  const createMember = async (payload: {
    full_name: string;
    email: string;
    password?: string;
    role: AppRole;
  }): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      const newMember: TeamMember = {
        id: `cdor-local-${Date.now()}`,
        full_name: payload.full_name.trim(),
        email: payload.email.trim().toLowerCase(),
        role: payload.role,
        is_active: true,
        created_at: new Date().toISOString(),
        totalElectores: 0,
        lastActivity: null,
      };

      const stored = localStorage.getItem('electoral_local_team');
      const list: TeamMember[] = stored ? JSON.parse(stored) : INITIAL_DEMO_TEAM;
      list.push(newMember);
      localStorage.setItem('electoral_local_team', JSON.stringify(list));
      setTeam(list);
      return true;
    }

    try {
      // 1. Registrar usuario en Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: payload.email.trim().toLowerCase(),
        password: payload.password || 'Electoral2026*',
        options: {
          data: {
            full_name: payload.full_name.trim(),
            role: payload.role,
          },
        },
      });

      if (signUpError) throw signUpError;

      // 2. Si se generó el usuario, verificar o actualizar el perfil directamente
      if (signUpData.user) {
        await (supabase.from('profiles') as any)
          .update({
            full_name: payload.full_name.trim(),
            role: payload.role,
            is_active: true,
          })
          .eq('id', signUpData.user.id);
      }

      fetchTeam();
      return true;
    } catch (err) {
      console.error('Error al crear nuevo miembro:', err);
      throw err;
    }
  };

  return {
    team,
    loading,
    error,
    toggleMemberStatus,
    changeMemberRole,
    createMember,
    refetch: fetchTeam,
  };
};
