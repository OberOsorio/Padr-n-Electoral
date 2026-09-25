import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { DashboardMetrics, TopPollingPlace, ElectorWithRegistrant } from '../../types';
import { useTenant } from '../../context/TenantContext';

const DEFAULT_META = 5000;

// Datos de demostración de alta fidelidad cuando no hay conexión activa a Supabase
const INITIAL_DEMO_ELECTORS: ElectorWithRegistrant[] = [
  {
    id: 'demo-1',
    cedula: '1047892341',
    nombres: 'Carlos Eduardo',
    apellidos: 'Mendoza',
    puesto_votacion: 'I.E. Santander Central',
    mesa: 4,
    notas: null,
    registrado_por: 'cdor-1',
    created_at: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    registrador: { full_name: 'Cdor. Javier Rivas', role: 'coordinador' },
  },
  {
    id: 'demo-2',
    cedula: '1098341902',
    nombres: 'Laura Sofía',
    apellidos: 'Herrera Morales',
    puesto_votacion: 'Coliseo Municipal de Deportes',
    mesa: 2,
    notas: null,
    registrado_por: 'cdor-2',
    created_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    registrador: { full_name: 'Cdra. Patricia Gómez', role: 'coordinador' },
  },
  {
    id: 'demo-3',
    cedula: '73542189',
    nombres: 'Miguel Ángel',
    apellidos: 'Morales Torres',
    puesto_votacion: 'Colegio Mayor Departamental',
    mesa: 7,
    notas: null,
    registrado_por: 'cdor-1',
    created_at: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    registrador: { full_name: 'Cdor. Javier Rivas', role: 'coordinador' },
  },
  {
    id: 'demo-4',
    cedula: '1143670554',
    nombres: 'Valentina',
    apellidos: 'Restrepo Castro',
    puesto_votacion: 'I.E. Técnico San Juan Bautista',
    mesa: 1,
    notas: null,
    registrado_por: 'cdor-3',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    registrador: { full_name: 'Cdor. Manuel Rojas', role: 'coordinador' },
  },
  {
    id: 'demo-5',
    cedula: '1052884112',
    nombres: 'Andrés Felipe',
    apellidos: 'Gómez Ortiz',
    puesto_votacion: 'Escuela Mixta El Prado',
    mesa: 3,
    notas: null,
    registrado_por: 'cdor-2',
    created_at: new Date(Date.now() - 1000 * 60 * 65).toISOString(),
    registrador: { full_name: 'Cdra. Patricia Gómez', role: 'coordinador' },
  },
];

const INITIAL_DEMO_TOP_POLLING: TopPollingPlace[] = [
  { puesto: 'I.E. Santander Central', total: 742, porcentaje: 21.7 },
  { puesto: 'Colegio Mayor Departamental', total: 618, porcentaje: 18.1 },
  { puesto: 'Coliseo Municipal de Deportes', total: 520, porcentaje: 15.2 },
  { puesto: 'I.E. Técnico San Juan Bautista', total: 435, porcentaje: 12.7 },
];

export const useDashboardData = (metaObjetivo: number = DEFAULT_META) => {
  const { currentTenant, currentTenantId } = useTenant();
  const effectiveMeta = currentTenant?.max_electors || metaObjetivo;

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalElectores: 0,
    metaCobertura: effectiveMeta,
    porcentajeMeta: 0,
    puestosActivos: 0,
    coordinadoresActivos: 0,
  });

  const [topPollingPlaces, setTopPollingPlaces] = useState<TopPollingPlace[]>([]);
  const [recentElectors, setRecentElectors] = useState<ElectorWithRegistrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [lastEventTimestamp, setLastEventTimestamp] = useState<Date>(new Date());

  const isMountedRef = useRef(true);

  // Función principal para consultar métricas
  const fetchDashboardData = useCallback(async () => {
    // Si no está conectado con Supabase, usar datos de demo almacenados o iniciales
    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('electoral_local_electors');
      const allLocalElectors: ElectorWithRegistrant[] = stored
        ? JSON.parse(stored)
        : INITIAL_DEMO_ELECTORS;

      // Filtrar por el tenant actual
      const scopedElectors = allLocalElectors.filter(
        (e) =>
          !currentTenantId ||
          e.tenant_id === currentTenantId ||
          (!e.tenant_id && currentTenantId === 'ten_alcaldia_2027')
      );

      const total = scopedElectors.length > 0 ? scopedElectors.length : 0;
      const pct = Math.min(100, Number(((total / effectiveMeta) * 100).toFixed(1)));

      const puestosMap: Record<string, { total: number; mesas: Set<number> }> = {};
      let conTelefonoCount = 0;

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
        if (e.telefono && String(e.telefono).trim().length >= 7) {
          conTelefonoCount += 1;
        }
      });

      const topPuestos: TopPollingPlace[] = Object.entries(puestosMap)
        .map(([puesto, data]) => ({
          puesto,
          total: data.total,
          porcentaje: total > 0 ? Number(((data.total / total) * 100).toFixed(1)) : 0,
          mesasCount: data.mesas.size || 1,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 4);

      const contactPct = total > 0 ? Math.round((conTelefonoCount / total) * 100) : 100;

      setMetrics({
        totalElectores: total,
        metaCobertura: effectiveMeta,
        porcentajeMeta: pct,
        puestosActivos: Object.keys(puestosMap).length || (total > 0 ? 1 : 0),
        coordinadoresActivos: 3,
        lideresActivos: 8,
        contactabilidadPct: contactPct,
        totalConTelefono: conTelefonoCount,
      });

      setTopPollingPlaces(
        topPuestos.length > 0
          ? topPuestos
          : INITIAL_DEMO_TOP_POLLING.map((p) => ({ ...p, mesasCount: 3 }))
      );
      setRecentElectors(scopedElectors.slice(0, 5));
      setLoading(false);
      setIsLiveActive(true);
      return;
    }

    try {
      setLoading(true);

      // 1. Total de Electores Registrados por Tenant
      let electoresQuery = supabase.from('electores').select('*', { count: 'exact', head: true });
      if (currentTenantId) {
        electoresQuery = (electoresQuery as any).eq('tenant_id', currentTenantId);
      }
      const { count: totalElectores, error: countError } = await electoresQuery;

      if (countError) throw countError;
      const totalCount = totalElectores ?? 0;

      // 2. Coordinadores y Líderes Activos por Tenant
      let profilesQuery = supabase.from('profiles').select('role').eq('is_active', true);
      if (currentTenantId) {
        profilesQuery = (profilesQuery as any).eq('tenant_id', currentTenantId);
      }
      const { data: profilesList, error: profilesError } = await profilesQuery;

      if (profilesError) console.error('Error al consultar perfiles:', profilesError);

      let coordinadoresCount = 0;
      let lideresCount = 0;
      (profilesList || []).forEach((p: any) => {
        if (p.role === 'coordinador' || p.role === 'admin') coordinadoresCount++;
        if (p.role === 'lider') lideresCount++;
      });
      // Fallback mínimo si la base de datos recién inicia
      if (coordinadoresCount === 0) coordinadoresCount = 1;

      // 3. Puestos de Votación, Mesas y Teléfonos por Tenant
      let puestosQuery = supabase.from('electores').select('puesto_votacion, mesa, telefono');
      if (currentTenantId) {
        puestosQuery = (puestosQuery as any).eq('tenant_id', currentTenantId);
      }
      const { data: electoresData, error: puestosError } = await puestosQuery;

      if (puestosError) console.error('Error al obtener puestos y electores:', puestosError);

      const puestosMap: Record<string, { total: number; mesas: Set<number> }> = {};
      let conTelefonoCount = 0;
      const rows = (electoresData as { puesto_votacion: string; mesa: number; telefono?: string }[] | null) || [];
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
        if (item.telefono && String(item.telefono).trim().length >= 7) {
          conTelefonoCount++;
        }
      });

      const distinctPuestosCount = Object.keys(puestosMap).length;

      // Calcular Top 4 Puestos con porcentaje relativo y mesas alcanzadas
      const sortedPuestos: TopPollingPlace[] = Object.entries(puestosMap)
        .map(([puesto, data]) => ({
          puesto,
          total: data.total,
          porcentaje: totalCount > 0 ? Number(((data.total / totalCount) * 100).toFixed(1)) : 0,
          mesasCount: data.mesas.size || 1,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 4);

      const contactPct = totalCount > 0 ? Math.round((conTelefonoCount / totalCount) * 100) : 100;

      // 4. Últimos 5 Electores Registrados por Tenant
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
        .limit(5);

      if (currentTenantId) {
        recentQuery = (recentQuery as any).eq('tenant_id', currentTenantId);
      }

      const { data: rawRecent, error: recentError } = await recentQuery;

      if (recentError) console.error('Error al obtener electores recientes:', recentError);

      if (isMountedRef.current) {
        const calculatedPercentage = totalCount > 0
          ? Math.min(100, Number(((totalCount / effectiveMeta) * 100).toFixed(1)))
          : 0;

        setMetrics({
          totalElectores: totalCount,
          metaCobertura: effectiveMeta,
          porcentajeMeta: calculatedPercentage,
          puestosActivos: distinctPuestosCount,
          coordinadoresActivos: coordinadoresCount,
          lideresActivos: lideresCount,
          contactabilidadPct: contactPct,
          totalConTelefono: conTelefonoCount,
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
          registrador: item.registrador ? {
            full_name: item.registrador.full_name,
            role: item.registrador.role,
          } : null,
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
          metaCobertura: effectiveMeta,
          porcentajeMeta: 0,
          puestosActivos: 0,
          coordinadoresActivos: 1,
        });
        setTopPollingPlaces([]);
        setRecentElectors([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [metaObjetivo, effectiveMeta, currentTenantId]);

  // Suscripción Realtime en Supabase
  useEffect(() => {
    isMountedRef.current = true;
    fetchDashboardData();

    if (!isSupabaseConfigured) {
      // Escuchar eventos en ventana para sincronización local
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

    // Escuchar eventos INSERT en la tabla 'electores'
    const channel = supabase
      .channel('dashboard-electores-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
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
