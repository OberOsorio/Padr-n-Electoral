import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';

export interface ElectorRow {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  telefono?: string;
  puesto_votacion?: string;
  mesa?: string;
  created_at: string;
  registrado_por?: string;
  campana_nombre?: string;
  tenant_id?: string | null;
  raw?: any;
}

export interface UseElectoresOptions {
  isOwnerMode?: boolean;
  selectedTenantId?: string | null;
  currentUserId?: string;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
}

export function useRealElectoresList({
  isOwnerMode = false,
  selectedTenantId = null,
  currentUserId,
  page = 1,
  pageSize = 15,
  searchQuery = '',
}: UseElectoresOptions) {
  const [electores, setElectores] = useState<ElectorRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchElectores = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Iniciar query base a datos reales con join relacional a perfiles y campañas
      let query = (supabase.from('electores') as any)
        .select(
          `
          id, cedula, nombres, apellidos, telefono, puesto_votacion, mesa, created_at, registrado_por, tenant_id,
          profiles(full_name),
          tenants(name)
        `,
          { count: 'exact' }
        );

      // 1. Aplicación de filtros según contexto
      if (isOwnerMode) {
        // En modo propietario agnóstico: si seleccionó un tenant específico se filtra, sino muestra global
        if (selectedTenantId) {
          query = query.eq('tenant_id', selectedTenantId);
        }
      } else {
        // Líder normal: filtrado obligatorio por campaña y autor
        if (selectedTenantId) {
          query = query.eq('tenant_id', selectedTenantId);
        }
        if (currentUserId) {
          query = query.eq('registrado_por', currentUserId);
        }
      }

      // 2. Filtro de búsqueda en tiempo real
      const cleanSearch = searchQuery.trim();
      if (cleanSearch) {
        if (/^\d+$/.test(cleanSearch)) {
          query = query.ilike('cedula', `%${cleanSearch}%`);
        } else {
          query = query.or(
            `nombres.ilike.%${cleanSearch}%,apellidos.ilike.%${cleanSearch}%,puesto_votacion.ilike.%${cleanSearch}%`
          );
        }
      }

      // 3. Paginación y orden cronológico
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, count, error: queryError } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (queryError) throw queryError;

      const formateados: ElectorRow[] = (data || []).map((item: any) => ({
        id: item.id,
        cedula: item.cedula,
        nombres: item.nombres,
        apellidos: item.apellidos,
        telefono: item.telefono || '—',
        puesto_votacion: item.puesto_votacion || 'No asignado',
        mesa: item.mesa ? `Mesa ${item.mesa}` : '—',
        created_at: item.created_at
          ? new Date(item.created_at).toLocaleDateString('es-CO', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })
          : '—',
        registrado_por: item.profiles?.full_name || 'Sistema / Propietario',
        campana_nombre: item.tenants?.name || 'General / Agnóstica',
        tenant_id: item.tenant_id,
        raw: item,
      }));

      setElectores(formateados);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Error al cargar electores reales:', err);
      setError(err.message || 'Error cargando datos reales.');
      // En caso de fallo de red, intentar leer de respaldo local
      try {
        const stored = localStorage.getItem('electoral_leader_electors');
        if (stored) {
          const localList: any[] = JSON.parse(stored);
          const mapped: ElectorRow[] = localList.map((item) => ({
            id: item.id || `loc-${item.cedula}`,
            cedula: item.cedula,
            nombres: item.nombres,
            apellidos: item.apellidos,
            telefono: item.telefono || '—',
            puesto_votacion: item.puesto_votacion || 'No asignado',
            mesa: item.mesa ? `Mesa ${item.mesa}` : '—',
            created_at: item.created_at
              ? new Date(item.created_at).toLocaleDateString('es-CO')
              : 'Reciente',
            registrado_por: 'Local / Cache',
            campana_nombre: 'Local',
            tenant_id: item.tenant_id,
            raw: item,
          }));
          setElectores(mapped);
          setTotalCount(mapped.length);
        }
      } catch {
        // ignore
      }
    } finally {
      setLoading(false);
    }
  }, [isOwnerMode, selectedTenantId, currentUserId, page, pageSize, searchQuery]);

  useEffect(() => {
    fetchElectores();
  }, [fetchElectores]);

  return { electores, totalCount, loading, error, refetch: fetchElectores };
}
