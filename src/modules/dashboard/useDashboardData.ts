import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { DashboardMetrics, TopPollingPlace, ElectorWithRegistrant } from '../../types';
import { useTenant } from '../../context/TenantContext';
import { PREDEFINED_POLLING_PLACES } from '../electors/constants';

export const useDashboardData = () => {
  const { currentTenantId } = useTenant();

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalElectores: 0,
    puestosConElectores: 0,
    totalPuestosCampana: PREDEFINED_POLLING_PLACES.length,
    lideresConRegistros: 0,
  });

  const [topPollingPlaces, setTopPollingPlaces] = useState<TopPollingPlace[]>([]);
  const [recentElectors, setRecentElectors] = useState<ElectorWithRegistrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [lastEventTimestamp, setLastEventTimestamp] = useState<Date>(new Date());

  const isMountedRef = useRef(true);

  // Mapeo rápido de nombres de puestos a su zona correspondiente
  const pollingZonesMap = useRef(
    new Map(PREDEFINED_POLLING_PLACES.map((p) => [p.name.toLowerCase().trim(), p.zone]))
  );

  // Función principal para consultar métricas en vivo desde Supabase
  const fetchDashboardData = useCallback(async () => {
    // Modo local / desarrollo sin conexión
    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('electoral_local_electors');
      const allLocalElectors: ElectorWithRegistrant[] = stored ? JSON.parse(stored) : [];

      const scopedElectors = allLocalElectors.filter(
        (e) => !currentTenantId || e.tenant_id === currentTenantId
      );

      const total = scopedElectors.length;
      const puestosMap: Record<string, { total: number; mesas: Set<number> }> = {};
      const distinctLideres = new Set<string>();

      scopedElectors.forEach((e) => {
        if (e.puesto_votacion) {
          const p = e.puesto_votacion.trim();
          if (!puestosMap[p]) {
            puestosMap[p] = { total: 0, mesas: new Set<number>() };
          }
          puestosMap[p].total += 1;
          if (e.mesa) {
            puestosMap[p].mesas.add(Number(e.mesa));
          }
        }
        if (e.registrado_por) {
          distinctLideres.add(e.registrado_por);
        }
      });

      const distinctPuestosCount = Object.keys(puestosMap).length;
      const totalPuestos = Math.max(PREDEFINED_POLLING_PLACES.length, distinctPuestosCount);

      const topPuestos: TopPollingPlace[] = Object.entries(puestosMap)
        .map(([puesto, data]) => {
          const matchedZone = pollingZonesMap.current.get(puesto.toLowerCase().trim()) || 'Zona Urbana';
          return {
            puesto,
            zona: matchedZone,
            total: data.total,
            porcentaje: total > 0 ? Number(((data.total / total) * 100).toFixed(1)) : 0,
            mesasCount: data.mesas.size || 1,
          };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);

      setMetrics({
        totalElectores: total,
        puestosConElectores: distinctPuestosCount,
        totalPuestosCampana: totalPuestos,
        lideresConRegistros: distinctLideres.size,
      });

      setTopPollingPlaces(topPuestos);
      setRecentElectors(scopedElectors.slice(0, 6));
      setLoading(false);
      setIsLiveActive(true);
      return;
    }

    try {
      setLoading(true);

      // 1. Total de Electores Registrados para la Campaña Activa
      let electoresCountQuery = supabase
        .from('electores')
        .select('*', { count: 'exact', head: true });

      if (currentTenantId) {
        electoresCountQuery = (electoresCountQuery as any).eq('tenant_id', currentTenantId);
      }
      const { count: totalElectores, error: countError } = await electoresCountQuery;
      if (countError) throw countError;
      const totalCount = totalElectores ?? 0;

      // 2. Consulta de Puestos y Registradores Activos
      let electoresDataQuery = supabase
        .from('electores')
        .select('puesto_votacion, mesa, registrado_por');

      if (currentTenantId) {
        electoresDataQuery = (electoresDataQuery as any).eq('tenant_id', currentTenantId);
      }
      const { data: electoresRows, error: dataError } = await electoresDataQuery;
      if (dataError) console.error('Error al consultar datos de electores:', dataError);

      const puestosMap: Record<string, { total: number; mesas: Set<number> }> = {};
      const distinctLideres = new Set<string>();

      const rows = (electoresRows as { puesto_votacion: string; mesa: number; registrado_por?: string }[] | null) || [];
      rows.forEach((item) => {
        const name = item.puesto_votacion?.trim();
        if (name) {
          if (!puestosMap[name]) {
            puestosMap[name] = { total: 0, mesas: new Set<number>() };
          }
          puestosMap[name].total += 1;
          if (item.mesa) {
            puestosMap[name].mesas.add(Number(item.mesa));
          }
        }
        if (item.registrado_por) {
          distinctLideres.add(item.registrado_por);
        }
      });

      const distinctPuestosCount = Object.keys(puestosMap).length;
      const totalPuestos = Math.max(PREDEFINED_POLLING_PLACES.length, distinctPuestosCount);

      // Top Puestos de Votación con cálculo porcentual real
      const sortedPuestos: TopPollingPlace[] = Object.entries(puestosMap)
        .map(([puesto, data]) => {
          const matchedZone = pollingZonesMap.current.get(puesto.toLowerCase().trim()) || 'Zona Urbana';
          return {
            puesto,
            zona: matchedZone,
            total: data.total,
            porcentaje: totalCount > 0 ? Number(((data.total / totalCount) * 100).toFixed(1)) : 0,
            mesasCount: data.mesas.size || 1,
          };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);

      // 3. Últimos 6 Electores Registrados en Tiempo Real
      let recentQuery = supabase
        .from('electores')
        .select(`
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
        `)
        .order('created_at', { ascending: false })
        .limit(6);

      if (currentTenantId) {
        recentQuery = (recentQuery as any).eq('tenant_id', currentTenantId);
      }

      const { data: rawRecent, error: recentError } = await recentQuery;
      if (recentError) console.error('Error al obtener electores recientes:', recentError);

      if (isMountedRef.current) {
        setMetrics({
          totalElectores: totalCount,
          puestosConElectores: distinctPuestosCount,
          totalPuestosCampana: totalPuestos,
          lideresConRegistros: distinctLideres.size,
        });

        setTopPollingPlaces(sortedPuestos);

        const formattedRecent: ElectorWithRegistrant[] = (rawRecent || []).map((item: any) => ({
          id: item.id,
          cedula: item.cedula || item.documento_identidad || '',
          nombres: item.nombres || item.nombre_completo || 'Elector',
          apellidos: item.apellidos || '',
          telefono: item.telefono,
          puesto_votacion: item.puesto_votacion,
          mesa: item.mesa || 1,
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

        setRecentElectors(formattedRecent);
        setLastEventTimestamp(new Date());
        setIsLiveActive(true);
      }
    } catch (err) {
      console.error('Error al cargar datos del dashboard:', err);
      if (isMountedRef.current) {
        setMetrics({
          totalElectores: 0,
          puestosConElectores: 0,
          totalPuestosCampana: PREDEFINED_POLLING_PLACES.length,
          lideresConRegistros: 0,
        });
        setTopPollingPlaces([]);
        setRecentElectors([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [currentTenantId]);

  // Suscripción Realtime en Supabase
  useEffect(() => {
    isMountedRef.current = true;
    fetchDashboardData();

    if (!isSupabaseConfigured) {
      const handleLocalInsert = () => {
        setLastEventTimestamp(new Date());
        fetchDashboardData();
      };
      window.addEventListener('elector_registered', handleLocalInsert);
      return () => {
        isMountedRef.current = false;
        window.removeEventListener('elector_registered', handleLocalInsert);
      };
    }

    // Escuchar eventos en la tabla 'electores'
    const channel = supabase
      .channel('dashboard-electores-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'electores',
        },
        () => {
          setLastEventTimestamp(new Date());
          fetchDashboardData();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsLiveActive(true);
        }
      });

    return () => {
      isMountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [fetchDashboardData]);

  return {
    metrics,
    topPollingPlaces,
    recentElectors,
    loading,
    isLiveActive,
    lastEventTimestamp,
    refetch: fetchDashboardData,
  };
};
