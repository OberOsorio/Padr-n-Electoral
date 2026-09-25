import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { ElectorWithRegistrant, Elector } from '../../types';
import { PREDEFINED_POLLING_PLACES } from './constants';
import { useTenant } from '../../context/TenantContext';

export interface CoordinatorOption {
  id: string;
  name: string;
}

// Semilla de datos demostrativos en caso de entorno local sin Supabase configurado
const INITIAL_DEMO_ELECTORS: ElectorWithRegistrant[] = [
  {
    id: 'el-001',
    cedula: '1047892341',
    nombres: 'Carlos Eduardo',
    apellidos: 'Mendoza Torres',
    telefono: '3124567890',
    puesto_votacion: 'I.E. Santander Central',
    mesa: 4,
    notas: 'Líder comunal barrio El Bosque',
    registrado_por: 'cdor-1',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    registrador: { full_name: 'Cdor. Javier Rivas', role: 'coordinador' },
  },
  {
    id: 'el-002',
    cedula: '1098341902',
    nombres: 'Laura Sofía',
    apellidos: 'Herrera Morales',
    telefono: '3187654321',
    puesto_votacion: 'Coliseo Municipal de Deportes',
    mesa: 2,
    notas: 'Requiere verificación de transporte',
    registrado_por: 'cdor-2',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    registrador: { full_name: 'Cdra. Patricia Gómez', role: 'coordinador' },
  },
  {
    id: 'el-003',
    cedula: '73542189',
    nombres: 'Miguel Ángel',
    apellidos: 'Morales Torres',
    telefono: '3001239874',
    puesto_votacion: 'Colegio Mayor Departamental',
    mesa: 7,
    notas: null,
    registrado_por: 'cdor-1',
    created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    registrador: { full_name: 'Cdor. Javier Rivas', role: 'coordinador' },
  },
  {
    id: 'el-004',
    cedula: '1143670554',
    nombres: 'Valentina',
    apellidos: 'Restrepo Castro',
    telefono: '3159871234',
    puesto_votacion: 'I.E. Técnico San Juan Bautista',
    mesa: 1,
    notas: 'Familia extendida en la misma mesa',
    registrado_por: 'cdor-3',
    created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    registrador: { full_name: 'Cdor. Manuel Rojas', role: 'coordinador' },
  },
  {
    id: 'el-005',
    cedula: '1052884112',
    nombres: 'Andrés Felipe',
    apellidos: 'Gómez Ortiz',
    telefono: null,
    puesto_votacion: 'Escuela Mixta El Prado',
    mesa: 3,
    notas: null,
    registrado_por: 'cdor-2',
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    registrador: { full_name: 'Cdra. Patricia Gómez', role: 'coordinador' },
  },
  {
    id: 'el-006',
    cedula: '32890451',
    nombres: 'María Elena',
    apellidos: 'Duarte Salcedo',
    telefono: '3116549870',
    puesto_votacion: 'I.E. Santander Central',
    mesa: 8,
    notas: 'Coordinadora de mesa voluntaria',
    registrado_por: 'cdor-1',
    created_at: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    registrador: { full_name: 'Cdor. Javier Rivas', role: 'coordinador' },
  },
  {
    id: 'el-007',
    cedula: '1088451239',
    nombres: 'Jorge Luis',
    apellidos: 'Peña Villalobos',
    telefono: '3142233445',
    puesto_votacion: 'Universidad del Valle - Sede Norte',
    mesa: 5,
    notas: null,
    registrado_por: 'cdor-3',
    created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    registrador: { full_name: 'Cdor. Manuel Rojas', role: 'coordinador' },
  },
  {
    id: 'el-008',
    cedula: '45781290',
    nombres: 'Claudia Patricia',
    apellidos: 'Caicedo Ramos',
    telefono: '3208899001',
    puesto_votacion: 'Institución Educativa Normal Superior',
    mesa: 3,
    notas: null,
    registrado_por: 'cdor-2',
    created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    registrador: { full_name: 'Cdra. Patricia Gómez', role: 'coordinador' },
  },
  {
    id: 'el-009',
    cedula: '1045990112',
    nombres: 'Héctor Fabio',
    apellidos: 'Vargas Londoño',
    telefono: '3167788990',
    puesto_votacion: 'I.E. Santander Central',
    mesa: 11,
    notas: null,
    registrado_por: 'cdor-1',
    created_at: new Date(Date.now() - 1000 * 60 * 840).toISOString(),
    registrador: { full_name: 'Cdor. Javier Rivas', role: 'coordinador' },
  },
  {
    id: 'el-010',
    cedula: '1130678901',
    nombres: 'Daniela',
    apellidos: 'Bermúdez Cifuentes',
    telefono: '3174455667',
    puesto_votacion: 'Coliseo Municipal de Deportes',
    mesa: 9,
    notas: 'Votante primerizo',
    registrado_por: 'cdor-2',
    created_at: new Date(Date.now() - 1000 * 60 * 960).toISOString(),
    registrador: { full_name: 'Cdra. Patricia Gómez', role: 'coordinador' },
  },
];

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
  const { currentTenantId } = useTenant();

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
  }, [currentTenantId]);

  // 2. Consulta de Electores con Paginación Server-Side y Filtros
  const fetchElectors = useCallback(async () => {
    setLoading(true);
    setError(null);

    // Modo Demostración Local con Aislamiento de Tenant
    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('electoral_local_electors');
      let dataset: ElectorWithRegistrant[] = stored
        ? JSON.parse(stored)
        : INITIAL_DEMO_ELECTORS;

      // Asegurar que si el localStorage está vacío se inicialice con la semilla
      if (dataset.length === 0) {
        dataset = INITIAL_DEMO_ELECTORS;
        localStorage.setItem('electoral_local_electors', JSON.stringify(dataset));
      }

      // Aislamiento por Tenant
      const scopedByTenant = dataset.filter(
        (e) =>
          !currentTenantId ||
          e.tenant_id === currentTenantId ||
          (!e.tenant_id && currentTenantId === 'ten_alcaldia_2027')
      );

      // Filtrado local
      let filtered = [...scopedByTenant];

      if (puestoFilter && puestoFilter !== 'all') {
        filtered = filtered.filter((e) => e.puesto_votacion === puestoFilter);
      }

      if (coordinadorFilter && coordinadorFilter !== 'all') {
        filtered = filtered.filter((e) => e.registrado_por === coordinadorFilter);
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (e) =>
            e.cedula.toLowerCase().includes(q) ||
            e.nombres.toLowerCase().includes(q) ||
            e.apellidos.toLowerCase().includes(q) ||
            `${e.nombres} ${e.apellidos}`.toLowerCase().includes(q)
        );
      }

      const total = filtered.length;
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginated = filtered.slice(from, to);

      if (isMountedRef.current) {
        setElectors(paginated);
        setTotalCount(total);
        setLoading(false);
      }
      return;
    }

    // Consulta Server-Side en Supabase con Aislamiento Estricto
    try {
      let query = (supabase.from('electores') as any)
        .select(
          `
          id,
          cedula,
          nombres,
          apellidos,
          telefono,
          puesto_votacion,
          mesa,
          notas,
          registrado_por,
          created_at,
          registrador:profiles(full_name, role)
        `,
          { count: 'exact' }
        );

      // Aislamiento explícito de Tenant (además de RLS)
      if (currentTenantId) {
        query = query.eq('tenant_id', currentTenantId);
      }

      // Filtro por puesto
      if (puestoFilter && puestoFilter !== 'all') {
        query = query.eq('puesto_votacion', puestoFilter);
      }

      // Filtro por coordinador
      if (coordinadorFilter && coordinadorFilter !== 'all') {
        query = query.eq('registrado_por', coordinadorFilter);
      }

      // Búsqueda por Cédula, Nombres o Apellidos con ilike
      if (searchQuery.trim()) {
        const term = searchQuery.trim();
        query = query.or(
          `cedula.ilike.%${term}%,nombres.ilike.%${term}%,apellidos.ilike.%${term}%`
        );
      }

      // Paginación por rangos exactos de Supabase
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      query = query.order('created_at', { ascending: false }).range(from, to);

      const { data, count, error: queryError } = await query;

      if (queryError) throw queryError;

      if (isMountedRef.current) {
        const formatted: ElectorWithRegistrant[] = (data || []).map((item: any) => ({
          id: item.id,
          cedula: item.cedula,
          nombres: item.nombres,
          apellidos: item.apellidos,
          telefono: item.telefono,
          puesto_votacion: item.puesto_votacion,
          mesa: item.mesa,
          notas: item.notas,
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
        setTotalCount(count ?? 0);
      }
    } catch (err: unknown) {
      console.error('Error al consultar electores en servidor:', err);
      if (isMountedRef.current) {
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
  }, [searchQuery, puestoFilter, coordinadorFilter, page, pageSize, currentTenantId]);

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
