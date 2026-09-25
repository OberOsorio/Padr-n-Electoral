import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { Elector, CollisionCheckResult } from '../../types';

export interface LeaderElector extends Elector {
  whatsapp_sent?: boolean;
}

const LOCAL_STORAGE_ELECTORS_KEY = 'electoral_local_electors';

// Semilla inicial exclusiva para el líder demostrativo
export const INITIAL_LEADER_ELECTORS: LeaderElector[] = [
  {
    id: 'lid-el-001',
    cedula: '1088492019',
    nombres: 'Esteban Camilo',
    apellidos: 'Torres Valderrama',
    telefono: '3145678901',
    puesto_votacion: 'I.E. Santander Central',
    mesa: 4,
    notas: 'Comprometido para primera hora 8:00 AM',
    registrado_por: 'usr_lider_001',
    tenant_id: 'ten_alcaldia_2027',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    whatsapp_sent: true,
  },
  {
    id: 'lid-el-002',
    cedula: '52890145',
    nombres: 'María Lucía',
    apellidos: 'Pérez Domínguez',
    telefono: '3109876543',
    puesto_votacion: 'Coliseo Municipal de Deportes',
    mesa: 2,
    notas: 'Requiere apoyo con transporte para adulto mayor',
    registrado_por: 'usr_lider_001',
    tenant_id: 'ten_alcaldia_2027',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    whatsapp_sent: true,
  },
  {
    id: 'lid-el-003',
    cedula: '1098765432',
    nombres: 'Andrés Felipe',
    apellidos: 'Ramírez Gómez',
    telefono: '3157891234',
    puesto_votacion: 'I.E. Santander Central',
    mesa: 4,
    notas: 'Líder juvenil barrio San Martín',
    registrado_por: 'usr_lider_001',
    tenant_id: 'ten_alcaldia_2027',
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    whatsapp_sent: false,
  },
  {
    id: 'lid-el-004',
    cedula: '43908123',
    nombres: 'Carmen Rosa',
    apellidos: 'Vargas Silva',
    telefono: '3123456789',
    puesto_votacion: 'Colegio Mayor Departamental',
    mesa: 6,
    notas: 'Votante verificada en censo',
    registrado_por: 'usr_lider_001',
    tenant_id: 'ten_alcaldia_2027',
    created_at: new Date(Date.now() - 1000 * 60 * 520).toISOString(),
    whatsapp_sent: true,
  },
  {
    id: 'lid-el-005',
    cedula: '1047812903',
    nombres: 'Jhonatan David',
    apellidos: 'Montoya Restrepo',
    telefono: '3209871122',
    puesto_votacion: 'I.E. Técnico San Juan Bautista',
    mesa: 1,
    notas: 'Familia con 4 votos',
    registrado_por: 'usr_lider_001',
    tenant_id: 'ten_alcaldia_2027',
    created_at: new Date(Date.now() - 1000 * 60 * 700).toISOString(),
    whatsapp_sent: false,
  },
  {
    id: 'lid-el-006',
    cedula: '1143890214',
    nombres: 'Daniela Sofía',
    apellidos: 'García Ospina',
    telefono: '3176549810',
    puesto_votacion: 'Coliseo Municipal de Deportes',
    mesa: 3,
    notas: null,
    registrado_por: 'usr_lider_001',
    tenant_id: 'ten_alcaldia_2027',
    created_at: new Date(Date.now() - 1000 * 60 * 950).toISOString(),
    whatsapp_sent: true,
  },
];

export const useLeaderWorkspace = (userId: string, tenantId: string | null) => {
  const [electors, setElectors] = useState<LeaderElector[]>([]);
  const [loading, setLoading] = useState(true);
  const [personalGoal, setPersonalGoal] = useState<number>(() => {
    const saved = localStorage.getItem(`electoral_leader_goal_${userId}`);
    return saved ? Number(saved) : 50;
  });

  const saveGoal = useCallback((newGoal: number) => {
    const valid = Math.max(10, Math.min(1000, newGoal));
    setPersonalGoal(valid);
    localStorage.setItem(`electoral_leader_goal_${userId}`, String(valid));
  }, [userId]);

  // Cargar electores registrados exclusivamente por este líder
  const fetchMyElectors = useCallback(async () => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_ELECTORS_KEY);
        let list: LeaderElector[] = stored ? JSON.parse(stored) : [];

        // Si la lista local no tiene electores del líder demo, sembrar datos de ejemplo
        const leaderRecords = list.filter((e) => e.registrado_por === userId);
        if (leaderRecords.length === 0 && userId === 'usr_lider_001') {
          list = [...INITIAL_LEADER_ELECTORS, ...list];
          localStorage.setItem(LOCAL_STORAGE_ELECTORS_KEY, JSON.stringify(list));
        }

        const filtered = list.filter((e) => e.registrado_por === userId);
        setElectors(filtered);
      } catch (err) {
        console.error('Error al cargar electores del líder en modo local:', err);
        setElectors(INITIAL_LEADER_ELECTORS);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const { data, error } = await (supabase.from('electores') as any)
        .select('*')
        .eq('registrado_por', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setElectors((data as LeaderElector[]) || []);
    } catch (err) {
      console.warn('Error consultando electores de Supabase para el líder:', err);
      // Respaldo local en caso de desconexión
      const stored = localStorage.getItem(LOCAL_STORAGE_ELECTORS_KEY);
      const list: LeaderElector[] = stored ? JSON.parse(stored) : INITIAL_LEADER_ELECTORS;
      setElectors(list.filter((e) => e.registrado_por === userId));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMyElectors();
  }, [fetchMyElectors]);

  // Chequeo de colisión en tiempo real
  const checkCollision = useCallback(async (cedula: string): Promise<CollisionCheckResult> => {
    const cleanCedula = cedula.trim().replace(/\D/g, '');
    if (!cleanCedula) return { exists: false };

    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem(LOCAL_STORAGE_ELECTORS_KEY);
      const list: any[] = stored ? JSON.parse(stored) : INITIAL_LEADER_ELECTORS;
      const found = list.find((e) => e.cedula === cleanCedula);
      if (found) {
        // Consultar rol y nombre del operador
        const teamStored = localStorage.getItem('electoral_local_team');
        const teamList: any[] = teamStored ? JSON.parse(teamStored) : [];
        const op = teamList.find((m: any) => m.id === found.registrado_por);

        return {
          exists: true,
          elector: {
            id: found.id,
            cedula: found.cedula,
            nombres: found.nombres,
            apellidos: found.apellidos,
            telefono: found.telefono,
            puesto_votacion: found.puesto_votacion,
            mesa: found.mesa,
            created_at: found.created_at,
            registrado_por_nombre:
              found.registrado_por === userId
                ? 'Ti mismo (Tú lo registraste)'
                : op?.full_name || 'Dr. Alejandro Morales',
            registrado_por_rol:
              found.registrado_por === userId
                ? 'lider'
                : op?.role || 'admin',
          },
        };
      }
      return { exists: false };
    }

    // 1. Intentar verificación mediante RPC check_existing_elector
    try {
      const { data: rpcData, error: rpcError } = await (supabase.rpc as any)('check_existing_elector', {
        p_cedula: cleanCedula,
        p_tenant_id: tenantId,
      });

      if (!rpcError && rpcData) {
        const item = Array.isArray(rpcData) ? rpcData[0] : rpcData;
        if (item && item.cedula) {
          return {
            exists: true,
            elector: {
              id: item.id,
              cedula: item.cedula,
              nombres: item.nombres,
              apellidos: item.apellidos,
              telefono: item.telefono,
              puesto_votacion: item.puesto_votacion,
              mesa: item.mesa,
              created_at: item.created_at,
              registrado_por_nombre:
                item.registrado_por === userId
                  ? 'Ti mismo (Tú lo registraste)'
                  : item.registrado_por_nombre || 'Personal de Campaña',
              registrado_por_rol: item.registrado_por_rol || 'admin',
            },
          };
        }
      }
    } catch (rpcErr) {
      console.warn('RPC check_existing_elector no disponible en vista de líder:', rpcErr);
    }

    // 2. Fallback relacional
    try {
      const { data, error } = await (supabase.from('electores') as any)
        .select(`
          id,
          cedula,
          nombres,
          apellidos,
          telefono,
          puesto_votacion,
          mesa,
          created_at,
          registrador:profiles(full_name, role)
        `)
        .eq('cedula', cleanCedula)
        .maybeSingle();

      if (!error && data) {
        return {
          exists: true,
          elector: {
            id: data.id,
            cedula: data.cedula,
            nombres: data.nombres,
            apellidos: data.apellidos,
            telefono: data.telefono,
            puesto_votacion: data.puesto_votacion,
            mesa: data.mesa,
            created_at: data.created_at,
            registrado_por_nombre:
              data.registrado_por === userId
                ? 'Ti mismo (Tú lo registraste)'
                : data.registrador?.full_name || 'Personal Autorizado',
            registrado_por_rol: data.registrador?.role || 'admin',
          },
        };
      }
    } catch (e) {
      console.warn('Error al verificar colisión en Supabase:', e);
    }

    return { exists: false };
  }, [tenantId, userId]);

  // Registro ágil de elector por el líder
  const registerElector = useCallback(async (newElectorData: {
    cedula: string;
    nombres: string;
    apellidos: string;
    telefono?: string;
    puesto_votacion: string;
    mesa: number;
    notas?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const cleanCedula = newElectorData.cedula.trim().replace(/\D/g, '');

    // 1. Validar que no exista colisión
    const collision = await checkCollision(cleanCedula);
    if (collision.exists) {
      return {
        success: false,
        error: `La cédula ${cleanCedula} ya se encuentra registrada en el censo (${collision.elector?.nombres} ${collision.elector?.apellidos} - Puesto: ${collision.elector?.puesto_votacion}).`,
      };
    }

    const newRecord: LeaderElector = {
      id: crypto.randomUUID ? crypto.randomUUID() : `el_${Date.now()}`,
      cedula: cleanCedula,
      nombres: newElectorData.nombres.trim(),
      apellidos: newElectorData.apellidos.trim(),
      telefono: newElectorData.telefono?.trim() || null,
      puesto_votacion: newElectorData.puesto_votacion,
      mesa: Number(newElectorData.mesa),
      notas: newElectorData.notas?.trim() || null,
      registrado_por: userId,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      whatsapp_sent: false,
    };

    // Actualizar estado local inmediato (Optimistic UI)
    setElectors((prev) => [newRecord, ...prev]);

    // Guardar en localStorage
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_ELECTORS_KEY);
      const list: any[] = stored ? JSON.parse(stored) : [];
      list.unshift(newRecord);
      localStorage.setItem(LOCAL_STORAGE_ELECTORS_KEY, JSON.stringify(list));
    } catch (err) {
      console.error('Error guardando en localStorage:', err);
    }

    // Persistir en Supabase si está disponible
    if (isSupabaseConfigured) {
      try {
        const { error } = await (supabase.from('electores') as any).insert({
          id: newRecord.id,
          cedula: newRecord.cedula,
          nombres: newRecord.nombres,
          apellidos: newRecord.apellidos,
          telefono: newRecord.telefono,
          puesto_votacion: newRecord.puesto_votacion,
          mesa: newRecord.mesa,
          notas: newRecord.notas,
          registrado_por: userId,
          tenant_id: tenantId,
        });

        if (error) {
          console.error('Error al insertar elector en Supabase:', error);
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        console.error('Error al sincronizar con Supabase:', err);
        return { success: false, error: err.message };
      }
    }

    return { success: true };
  }, [checkCollision, tenantId, userId]);

  // Marcar elector como contactado por WhatsApp
  const markWhatsAppSent = useCallback((electorId: string) => {
    setElectors((prev) =>
      prev.map((e) => (e.id === electorId ? { ...e, whatsapp_sent: true } : e))
    );

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_ELECTORS_KEY);
      if (stored) {
        const list: any[] = JSON.parse(stored);
        const updated = list.map((e) => (e.id === electorId ? { ...e, whatsapp_sent: true } : e));
        localStorage.setItem(LOCAL_STORAGE_ELECTORS_KEY, JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Error al actualizar whatsapp_sent:', err);
    }
  }, []);

  // Métricas personales del líder
  const stats = useMemo(() => {
    const total = electors.length;
    const goal = personalGoal;
    const percentage = goal > 0 ? Math.min(100, Math.round((total / goal) * 100)) : 0;
    const remaining = Math.max(0, goal - total);
    const withPhone = electors.filter((e) => !!e.telefono).length;

    // Calcular puesto principal
    const puestoCounts: Record<string, number> = {};
    electors.forEach((e) => {
      puestoCounts[e.puesto_votacion] = (puestoCounts[e.puesto_votacion] || 0) + 1;
    });

    let topPuesto = 'Sin registros aún';
    let maxPuestoCount = 0;
    Object.entries(puestoCounts).forEach(([name, count]) => {
      if (count > maxPuestoCount) {
        maxPuestoCount = count;
        topPuesto = name;
      }
    });

    return {
      total,
      goal,
      percentage,
      remaining,
      withPhone,
      topPuesto,
      topPuestoCount: maxPuestoCount,
    };
  }, [electors, personalGoal]);

  // Eliminar elector registrado por el líder
  const deleteElector = useCallback(async (electorId: string): Promise<boolean> => {
    setElectors((prev) => prev.filter((e) => e.id !== electorId));

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_ELECTORS_KEY);
      if (stored) {
        const list: any[] = JSON.parse(stored);
        const updated = list.filter((e) => e.id !== electorId);
        localStorage.setItem(LOCAL_STORAGE_ELECTORS_KEY, JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Error al eliminar en localStorage:', err);
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await (supabase.from('electores') as any).delete().eq('id', electorId);
        if (error) {
          console.error('Error al eliminar en Supabase:', error);
          return false;
        }
      } catch (err) {
        console.error('Error al eliminar en Supabase:', err);
        return false;
      }
    }

    return true;
  }, []);

  // Actualizar elector registrado por el líder
  const updateElector = useCallback(async (id: string, updates: Partial<Elector>): Promise<boolean> => {
    setElectors((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e))
    );

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_ELECTORS_KEY);
      if (stored) {
        const list: any[] = JSON.parse(stored);
        const updated = list.map((e) => (e.id === id ? { ...e, ...updates } : e));
        localStorage.setItem(LOCAL_STORAGE_ELECTORS_KEY, JSON.stringify(updated));
      }
    } catch (err) {
      console.error('Error al actualizar en localStorage:', err);
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await (supabase.from('electores') as any).update({
          nombres: updates.nombres,
          apellidos: updates.apellidos,
          telefono: updates.telefono,
          puesto_votacion: updates.puesto_votacion,
          mesa: updates.mesa,
          notas: updates.notas,
        }).eq('id', id);

        if (error) {
          console.error('Error al actualizar en Supabase:', error);
          return false;
        }
      } catch (err) {
        console.error('Error al actualizar en Supabase:', err);
        return false;
      }
    }

    return true;
  }, []);

  return {
    electors,
    loading,
    personalGoal,
    saveGoal,
    registerElector,
    deleteElector,
    updateElector,
    checkCollision,
    markWhatsAppSent,
    refreshElectors: fetchMyElectors,
    stats,
  };
};
