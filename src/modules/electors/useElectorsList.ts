import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { ElectorWithRegistrant, Elector } from '../../types';
import { PREDEFINED_POLLING_PLACES } from './constants';
import { useTenant } from '../../context/TenantContext';

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
      query = query.eq('puesto_votacion', puestoFilter);
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
  const { currentTenantId, loading: tenantLoading } = useTenant();

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
  const fetchElectors = useCallback(async () => {
    // Si aún está resolviendo el tenant, esperar
    if (tenantLoading) {
      return;
    }

    setLoading(true);
    setError(null);

    // Si no está configurado Supabase, retornar vacío
    if (!isSupabaseConfigured) {
      if (isMountedRef.current) {
        setElectors([]);
        setTotalCount(0);
        setLoading(false);
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
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [searchQuery, puestoFilter, coordinadorFilter, page, pageSize, currentTenantId, tenantLoading]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchElectors();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchElectors]);

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
      fetchElectors();
      return true;
    }

    try {
      const { error: delError } = await (supabase.from('electores') as any)
        .delete()
        .eq('id', id);

      if (delError) throw delError;

      fetchElectors();
      return true;
    } catch (err) {
      console.error('Error al eliminar elector:', err);
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
      fetchElectors();
      return true;
    }

    try {
      const { error: updError } = await (supabase.from('electores') as any)
        .update(updates)
        .eq('id', id);

      if (updError) throw updError;

      fetchElectors();
      return true;
    } catch (err) {
      console.error('Error al actualizar elector:', err);
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
    updateElector,
    refetch: fetchElectors,
    pollingPlacesList: PREDEFINED_POLLING_PLACES.map((p) => p.name),
  };
};
