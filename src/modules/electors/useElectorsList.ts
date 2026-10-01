import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { ElectorWithRegistrant, Elector } from '../../types';
import { useTenant } from '../../context/TenantContext';
import { useElectorsRealtime } from './useElectorsRealtime';
import { useJurisdictionPuestos } from './useJurisdictionPuestos';
import {
  eliminarElectorEnBaseDatos,
  eliminarElectoresPorLoteEnBaseDatos,
} from '../../services/electorService';

export interface CoordinatorOption {
  id: string;
  name: string;
}

export interface GetElectoresPaginadosParams {
  tenantId: string;
  pageIndex: number;
  pageSize: number;
  searchQuery?: string;
  puestoFilter?: string;
  coordinadorFilter?: string;
}

export interface GetElectoresPaginadosResult {
  electores: any[];
  total: number;
  error: string | null;
}

/**
 * Consulta paginada y segura del padrón electoral en Supabase.
 * Cuando la tabla está vacía (count === 0), retorna error estrictamente null.
 */
export async function getElectoresPaginados({
  tenantId,
  pageIndex = 0,
  pageSize = 25,
  searchQuery = '',
  puestoFilter = '',
  coordinadorFilter = '',
}: GetElectoresPaginadosParams): Promise<GetElectoresPaginadosResult> {
  try {
    if (!tenantId) {
      return { electores: [], total: 0, error: null };
    }

    const from = pageIndex * pageSize;
    const to = from + pageSize - 1;

    let query = (supabase.from('electores') as any)
      .select(
        `
        id,
        cedula,
        nombres,
        apellidos,
        edad,
        telefono,
        puesto_votacion,
        mesa,
        notas,
        registrado_por,
        created_at,
        registrador:profiles(full_name, role)
      `,
        { count: 'exact' }
      )
      .eq('tenant_id', tenantId);

    if (searchQuery && searchQuery.trim()) {
      const clean = searchQuery.trim().replace(/[^\w\s]/gi, '');
      if (clean) {
        query = query.or(`cedula.ilike.%${clean}%,nombres.ilike.%${clean}%,apellidos.ilike.%${clean}%`);
      }
    }

    if (puestoFilter && !['all', 'todos', ''].includes(puestoFilter.toLowerCase())) {
      query = query.ilike('puesto_votacion', `%${puestoFilter}%`);
    }

    if (coordinadorFilter && !['all', 'todos', ''].includes(coordinadorFilter.toLowerCase())) {
      query = query.eq('registrado_por', coordinadorFilter);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      if (error.code === 'PGRST116') {
        return { electores: [], total: 0, error: null };
      }
      console.warn('Alerta al consultar padrón:', error.message);
      return { electores: [], total: 0, error: error.message };
    }

    return {
      electores: data || [],
      total: count || 0,
      error: null, // Si no hay registros, el error debe ser estrictamente null
    };
  } catch (err: any) {
    return { electores: [], total: 0, error: err.message || 'Error de lectura' };
  }
}

const INITIAL_DEMO_ELECTORS: ElectorWithRegistrant[] = [];


export const useElectorsList = (
  searchQuery: string,
  puestoFilter: string,
  coordinadorFilter: string,
  page: number = 1,
  pageSize: number = 10
) => {
  const [electors, setElectors] = useState<ElectorWithRegistrant[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [coordinatorsList, setCoordinatorsList] = useState<CoordinatorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);
  const { currentTenant, currentTenantId, loading: tenantLoading } = useTenant();
  const { puestosCampana, getPuestosCampana } = useJurisdictionPuestos(currentTenant);

  // 1. Obtener lista de coordinadores para los filtros
  useEffect(() => {
    const fetchCoordinators = async () => {
      if (!isSupabaseConfigured) {
        setCoordinatorsList([
          { id: 'cdor-1', name: 'Cdor. Javier Rivas' },
          { id: 'cdor-2', name: 'Cdra. Patricia Gómez' },
          { id: 'cdor-3', name: 'Cdor. Manuel Rojas' },
        ]);
        return;
      }

      if (tenantLoading) return;

      try {
        let coordQuery = supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('is_active', true);

        if (currentTenantId) {
          coordQuery = (coordQuery as any).eq('tenant_id', currentTenantId);
        }

        const { data, error: profileErr } = await coordQuery;

        if (!profileErr && data) {
          const list: CoordinatorOption[] = (data as any[]).map((p) => ({
            id: p.id,
            name: p.full_name || 'Personal Autorizado',
          }));
          setCoordinatorsList(list);
        }
      } catch (err) {
        console.error('Error al cargar coordinadores:', err);
      }
    };

    fetchCoordinators();
  }, [currentTenantId, tenantLoading]);

  // 2. Consulta de Electores con Paginación Server-Side y Filtros
  const fetchElectors = useCallback(async (isSilent = false) => {
    // Si aún está resolviendo el tenant, esperar
    if (tenantLoading) {
      return;
    }

    if (!isSilent) {
      setLoading(true);
    }
    setError(null);

    // Si no está configurado Supabase, retornar vacío
    if (!isSupabaseConfigured) {
      if (isMountedRef.current) {
        setElectors([]);
        setTotalCount(0);
        if (!isSilent) setLoading(false);
      }
      return;
    }

    // Consulta Server-Side en Supabase con Aislamiento Estricto mediante getElectoresPaginados
    try {
      const pageIndex = Math.max(0, page - 1);
      const res = await getElectoresPaginados({
        tenantId: currentTenantId || '',
        pageIndex,
        pageSize,
        searchQuery,
        puestoFilter,
        coordinadorFilter,
      });

      if (!isMountedRef.current) return;

      if (res.error) {
        console.error('Error reportado al consultar electores:', res.error);
        setElectors([]);
        setTotalCount(0);
        setError(res.error);
        return;
      }

      const rows = Array.isArray(res.electores) ? res.electores : [];
      const formatted: ElectorWithRegistrant[] = rows.map((item: any) => ({
        id: item.id,
        cedula: item.cedula || '',
        nombres: item.nombres || '',
        apellidos: item.apellidos || '',
        edad: item.edad !== undefined && item.edad !== null ? Number(item.edad) : null,
        telefono: item.telefono || '',
        puesto_votacion: item.puesto_votacion || '',
        mesa: item.mesa || 0,
        notas: item.notas || null,
        registrado_por: item.registrado_por,
        created_at: item.created_at,
        registrador: item.registrador
          ? {
              full_name: item.registrador.full_name,
              role: item.registrador.role,
            }
          : null,
      }));

      setElectors(formatted);
      setTotalCount(res.total ?? rows.length);
      setError(null);
    } catch (err: unknown) {
      console.error('Error al consultar electores en servidor:', err);
      if (isMountedRef.current) {
        setElectors([]);
        setTotalCount(0);
        setError(
          err instanceof Error
            ? err.message
            : 'Error de conexión al recuperar el padrón electoral.'
        );
      }
    } finally {
      if (isMountedRef.current && !isSilent) {
        setLoading(false);
      }
    }
  }, [searchQuery, puestoFilter, coordinadorFilter, page, pageSize, currentTenantId, tenantLoading]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchElectors(false);

    // Escuchar eventos locales de registro para modo demo o fallback
    const handleLocalInsert = () => {
      fetchElectors(true);
    };
    window.addEventListener('elector_registered', handleLocalInsert);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('elector_registered', handleLocalInsert);
    };
  }, [fetchElectors]);

  // 3. Suscripción en Tiempo Real (Supabase Realtime WebSocket)
  const { isConnected: isRealtimeConnected } = useElectorsRealtime({
    tenantId: currentTenantId,
    enabled: isSupabaseConfigured && !tenantLoading,
    onElectorInserted: (newRow) => {
      // 1. Actualización inmediata del contador
      setTotalCount((prev) => prev + 1);

      // 2. Si estamos en la página 1 y el registro cumple con los filtros activos, anteponerlo a la tabla
      if (page === 1) {
        const matchesSearch =
          !searchQuery ||
          `${newRow.nombres || ''} ${newRow.apellidos || ''} ${newRow.cedula || ''}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const matchesPuesto =
          !puestoFilter ||
          ['all', 'todos', ''].includes(puestoFilter.toLowerCase()) ||
          newRow.puesto_votacion === puestoFilter;
        const matchesCoord =
          !coordinadorFilter ||
          ['all', 'todos', ''].includes(coordinadorFilter.toLowerCase()) ||
          newRow.registrado_por === coordinadorFilter;

        if (matchesSearch && matchesPuesto && matchesCoord) {
          const newFormatted: ElectorWithRegistrant = {
            id: newRow.id,
            cedula: newRow.cedula || '',
            nombres: newRow.nombres || '',
            apellidos: newRow.apellidos || '',
            edad:
              newRow.edad !== undefined && newRow.edad !== null
                ? Number(newRow.edad)
                : null,
            telefono: newRow.telefono || '',
            puesto_votacion: newRow.puesto_votacion || '',
            mesa: newRow.mesa || 0,
            notas: newRow.notas || null,
            registrado_por: newRow.registrado_por,
            created_at: newRow.created_at || new Date().toISOString(),
            registrador: null,
          };

          setElectors((prev) => {
            if (prev.some((e) => e.id === newRow.id)) return prev;
            return [newFormatted, ...prev.slice(0, pageSize - 1)];
          });
        }
      }

      // 3. Reconsulta silenciosa en segundo plano para poblar relaciones y validar paginación exacta
      fetchElectors(true);
    },
    onElectorDeleted: (oldRow) => {
      // 1. Decrementar contador en vivo de inmediato
      setTotalCount((prev) => Math.max(0, prev - 1));

      // 2. Remover visualmente de la tabla actual
      setElectors((prev) => prev.filter((e) => e.id !== oldRow.id));

      // 3. Reconsulta silenciosa en segundo plano para rellenar la página si queda hueco
      fetchElectors(true);
    },
    onElectorUpdated: (newRow) => {
      // Actualizar datos del elector en la tabla visualmente
      setElectors((prev) =>
        prev.map((e) =>
          e.id === newRow.id
            ? {
                ...e,
                ...newRow,
                edad:
                  newRow.edad !== undefined && newRow.edad !== null
                    ? Number(newRow.edad)
                    : e.edad,
              }
            : e
        )
      );

      // Reconsulta silenciosa
      fetchElectors(true);
    },
    onRefreshTotal: () => {
      // Reconsulta de reconciliación en background
      fetchElectors(true);
    },
  });

  // Función para eliminar elector
  const deleteElector = async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('electoral_local_electors');
      const list: ElectorWithRegistrant[] = stored
        ? JSON.parse(stored)
        : INITIAL_DEMO_ELECTORS;
      const updated = list.filter((e) => e.id !== id);
      localStorage.setItem('electoral_local_electors', JSON.stringify(updated));
      window.dispatchEvent(new Event('elector_registered'));
      fetchElectors(false);
      return true;
    }

    try {
      await eliminarElectorEnBaseDatos(id);

      // Actualizar estado local reactivo de inmediato
      setElectors((prev) => prev.filter((item) => item.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));

      window.dispatchEvent(new Event('elector_registered'));
      fetchElectors(false);
      return true;
    } catch (err) {
      console.error('[Electores] Error al eliminar elector:', err);
      throw err;
    }
  };

  // Función para actualizar elector
  const updateElector = async (
    id: string,
    updates: Partial<Elector>
  ): Promise<boolean> => {
    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('electoral_local_electors');
      const list: ElectorWithRegistrant[] = stored
        ? JSON.parse(stored)
        : INITIAL_DEMO_ELECTORS;
      const updated = list.map((e) =>
        e.id === id ? { ...e, ...updates } : e
      );
      localStorage.setItem('electoral_local_electors', JSON.stringify(updated));
      window.dispatchEvent(new Event('elector_registered'));
      fetchElectors(false);
      return true;
    }

    try {
      const { error: updError } = await (supabase.from('electores') as any)
        .update(updates)
        .eq('id', id);

      if (updError) throw updError;

      fetchElectors(false);
      return true;
    } catch (err) {
      console.error('Error al actualizar elector:', err);
      throw err;
    }
  };

  // Función para eliminar electores por lote
  const deleteElectorsBulk = async (ids: string[]): Promise<boolean> => {
    if (!ids || ids.length === 0) return false;

    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('electoral_local_electors');
      const list: ElectorWithRegistrant[] = stored
        ? JSON.parse(stored)
        : INITIAL_DEMO_ELECTORS;
      const idSet = new Set(ids);
      const updated = list.filter((e) => !idSet.has(e.id));
      localStorage.setItem('electoral_local_electors', JSON.stringify(updated));
      window.dispatchEvent(new Event('elector_registered'));
      fetchElectors(false);
      return true;
    }

    try {
      await eliminarElectoresPorLoteEnBaseDatos(ids);

      // Actualizar estado local reactivo de inmediato
      const idSet = new Set(ids);
      setElectors((prev) => prev.filter((item) => !idSet.has(item.id)));
      setTotalCount((prev) => Math.max(0, prev - ids.length));

      window.dispatchEvent(new Event('elector_registered'));
      fetchElectors(false);
      return true;
    } catch (err) {
      console.error('[Electores] Error al eliminar lote de electores:', err);
      throw err;
    }
  };

  return {
    electors,
    totalCount,
    coordinatorsList,
    loading,
    error,
    deleteElector,
    deleteElectorsBulk,
    updateElector,
    refetch: () => {
      fetchElectors(false);
      getPuestosCampana();
    },
    isRealtimeConnected,
    pollingPlacesList: puestosCampana,
  };
};
