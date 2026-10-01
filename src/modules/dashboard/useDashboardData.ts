import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useTenant } from '../../context/TenantContext';
import { type DateRangeOption } from './DateRangeSelector';
import { type CampaignNotification } from './NotificationCenter';
import { type PuestoMetrica } from './TerritoryDistributionCard';

export interface DashboardMetrics {
  totalElectores: number;
  totalHistorico: number;
  electoresActivos: number; // Electores con teléfono o estado confirmado
  totalLideres: number;
  lideresActivos: number;
  metaGlobal: number;
  porcentajeAvance: number;
  evolucionSemanal: { dia: string; total: number }[];
  distribucionPuestos: PuestoMetrica[];
  estadoEquipo: { activos: number; sinActividad: number; pendientes: number; total: number };
  rendimientoLideres: {
    id: string;
    nombre: string;
    rol: string;
    meta: number;
    gestionados: number;
    avance: number;
    estado: 'ACTIVO' | 'ATENCIÓN';
  }[];
  actividadReciente: {
    id: string;
    hora: string;
    texto: string;
    tipo: 'elector' | 'lider' | 'meta';
  }[];
  notifications: CampaignNotification[];
}

export const DEFAULT_METRICS: DashboardMetrics = {
  totalElectores: 0,
  totalHistorico: 0,
  electoresActivos: 0,
  totalLideres: 1,
  lideresActivos: 0,
  metaGlobal: 100,
  porcentajeAvance: 0,
  evolucionSemanal: [
    { dia: 'Dom', total: 0 },
    { dia: 'Lun', total: 0 },
    { dia: 'Mar', total: 0 },
    { dia: 'Mié', total: 0 },
    { dia: 'Jue', total: 0 },
    { dia: 'Vie', total: 0 },
    { dia: 'Sáb', total: 0 },
  ],
  distribucionPuestos: [],
  estadoEquipo: { activos: 0, sinActividad: 0, pendientes: 0, total: 1 },
  rendimientoLideres: [],
  actividadReciente: [],
  notifications: [],
};

export function formatCleanPollingPlace(raw: string): { nombre: string; zona: 'URBANA' | 'RURAL' } {
  if (!raw || raw.trim() === '') {
    return { nombre: 'Sin Asignar', zona: 'URBANA' };
  }

  const rawTrimmed = raw.trim();

  // Detectar si es zona rural por palabras clave típicas de la circunscripción (Cotorra / Córdoba)
  const isRural = /\b(CGTO|CORREGIMIENTO|VEREDA|VDA|RURAL|CASERIO|INSPECCION|C\.P\.|CENTRO POBLADO|BONGO|GOMEZ|GÓMEZ|TREMENTINO|PALMA|RANCHERIA|MORALES|ABANICO|PUNTA DE YANEZ|CARRIZAL|ABROJAL|MORALITO|FLORES|CULEBRA|CEDROS|AREPAS|CARRILLO)\b/i.test(rawTrimmed);

  // Limpiar códigos o nombres entre paréntesis iniciales ej: (BONGO)LOS GOMEZ -> LOS GOMEZ
  let clean = rawTrimmed.replace(/^\([A-Z0-9\s_-]+\)/i, '').trim();

  // Quitar etiquetas técnicas de direcciones y corregimientos redundantes
  clean = clean
    .replace(/\b(CGTO|CORREGIMIENTO)\s+[^,]+/i, '')
    .replace(/\bM\.D\.\s*CL\s*P\/PAL\b/i, '')
    .replace(/\bCL\s*P\/PAL\b/i, '')
    .replace(/\bCL\s*\d+.*$/i, '')
    .replace(/\bKR\s*\d+.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (clean.length < 3) {
    clean = rawTrimmed.replace(/^\([A-Z0-9\s_-]+\)/i, '').trim();
  }

  // Capitalización amigable en Title Case
  const formatted = clean
    .toLowerCase()
    .split(' ')
    .map((word) => {
      if (['de', 'la', 'del', 'los', 'las', 'y', 'en', 'el', 'san', 'santa'].includes(word)) return word;
      if (word === 'i.e.' || word === 'ie' || word === 'i.e') return 'I.E.';
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');

  return {
    nombre: formatted || rawTrimmed,
    zona: isRural ? 'RURAL' : 'URBANA',
  };
}

export const DEMO_PUESTOS_BLACKLIST = new Set([
  'i.e. santander central',
  'ie santander central',
  'santander central',
  'colegio mayor departamental',
  'coliseo municipal de deportes',
  'i.e. técnico san juan bautista',
  'i.e. tecnico san juan bautista',
  'ie tecnico san juan bautista',
  'escuela mixta el prado',
]);

export function useDashboardData(tenantIdProp?: string, selectedRange: DateRangeOption = '7days') {
  const { currentTenantId } = useTenant();
  const activeTenantId = tenantIdProp || currentTenantId || '';

  const [data, setData] = useState<DashboardMetrics>(DEFAULT_METRICS);
  const [loading, setLoading] = useState<boolean>(true);
  const isMountedRef = useRef(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // =========================================================================
      // 1. CARGA DE ELECTORES DESDE SUPABASE Y LOCALSTORAGE
      // =========================================================================
      let electoresRows: any[] = [];

      if (isSupabaseConfigured) {
        try {
          const authUserRes = await supabase.auth.getUser();
          console.log('[Dashboard Debug] Usuario actual:', authUserRes.data.user?.id);
        } catch (authErr) {
          console.log('[Dashboard Debug] Error obteniendo usuario:', authErr);
        }
        console.log('[Dashboard Debug] Tenant ID utilizado para la consulta:', activeTenantId);

        const { data: debugElectores, error: errElectoresDebug, count: debugCount } = await supabase
          .from('electores')
          .select('*', { count: 'exact' });

        console.log('[Dashboard Debug] Error de electores:', errElectoresDebug);
        console.log('[Dashboard Debug] Cantidad de electores encontrados sin filtro:', debugCount);
        console.log('[Dashboard Debug] Filas recibidas:', debugElectores);

        let query = supabase
          .from('electores')
          .select('id, cedula, nombres, apellidos, edad, mesa, puesto_votacion, created_at, registrado_por, telefono');

        if (activeTenantId) {
          query = (query as any).or(`tenant_id.eq.${activeTenantId},tenant_id.is.null`);
        }

        const { data: dbElectores, error: errElectores } = await query;
        if (!errElectores && dbElectores) {
          electoresRows = dbElectores;
        } else if (errElectores) {
          console.warn('Alerta al consultar electores en Supabase:', errElectores.message);
        }
      } else {
        // En modo offline sin Supabase: leer electores locales de localStorage
        try {
          const stored = typeof window !== 'undefined' ? localStorage.getItem('electoral_local_electors') : null;
          if (stored) {
            const localList: any[] = JSON.parse(stored);
            electoresRows = localList.filter(
              (e) => !activeTenantId || e.tenant_id === activeTenantId || !e.tenant_id
            );
          }
        } catch (locErr) {
          console.warn('Error leyendo electores locales:', locErr);
        }
      }

      // Excluir registros demo heredados de pruebas iniciales si existen
      electoresRows = electoresRows.filter((e) => {
        const rawPuesto = (e.puesto_votacion || '').toString().toLowerCase().trim();
        return !DEMO_PUESTOS_BLACKLIST.has(rawPuesto);
      });

      const totalHistorico = electoresRows.length;

      // =========================================================================
      // 2. FILTRADO TEMPORAL SEGÚN selectedRange ('today' | '7days' | '30days' | 'all')
      // =========================================================================
      const now = new Date();
      let startOfRange: Date | null = null;

      if (selectedRange === 'today') {
        startOfRange = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      } else if (selectedRange === '7days') {
        startOfRange = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (selectedRange === '30days') {
        startOfRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        startOfRange = null; // 'all'
      }

      const scopedElectores = startOfRange
        ? electoresRows.filter((e) => {
            if (!e.created_at) return false;
            const d = new Date(e.created_at);
            return !isNaN(d.getTime()) && d >= startOfRange!;
          })
        : electoresRows;

      const totalElectores = scopedElectores.length;
      const electoresActivos = scopedElectores.filter(
        (e) => e.telefono && String(e.telefono).trim() !== ''
      ).length || totalElectores;

      // =========================================================================
      // 3. LÍDERES Y PERFILES DE CAMPAÑA
      // =========================================================================
      let perfilesRows: any[] = [];

      if (isSupabaseConfigured) {
        let pQuery = supabase
          .from('profiles')
          .select('id, full_name, role, meta_electores, is_active');

        if (activeTenantId) {
          pQuery = (pQuery as any).or(`tenant_id.eq.${activeTenantId},tenant_id.is.null`);
        }

        const { data: dbProfiles, error: errProfiles } = await pQuery;
        if (!errProfiles && dbProfiles) {
          perfilesRows = dbProfiles;
        }
      }

      // Respaldo si no hay perfiles en la base de datos
      if (perfilesRows.length === 0) {
        perfilesRows = [
          {
            id: 'admin-default',
            full_name: 'ALEJANDRO DORIA',
            role: 'admin',
            meta_electores: 0,
            is_active: true,
          },
          {
            id: 'lider-default',
            full_name: 'Ober Osorio Orozco',
            role: 'lider',
            meta_electores: 100,
            is_active: true,
          },
        ];
      }

      // Conteo de electores por cada líder (dentro del período seleccionado)
      const conteoPorLider: Record<string, number> = {};
      scopedElectores.forEach((e) => {
        const leaderId = e.registrado_por || e.created_by;
        if (leaderId) {
          conteoPorLider[leaderId] = (conteoPorLider[leaderId] || 0) + 1;
        }
      });

      const totalLideres = perfilesRows.filter(
        (p) => p.role === 'lider' || p.role === 'coordinador'
      ).length || (perfilesRows.length > 1 ? perfilesRows.length - 1 : 1);

      // Meta global de la campaña
      const sumMetas = perfilesRows
        .filter((p) => p.role !== 'admin' && p.role !== 'candidato')
        .reduce((acc, p) => acc + (p.meta_electores || 0), 0);
      const metaGlobal = sumMetas > 0 ? sumMetas : (perfilesRows.reduce((acc, p) => acc + (p.meta_electores || 0), 0) || 100);
      const porcentajeAvance = metaGlobal > 0 ? Number(((totalHistorico / metaGlobal) * 100).toFixed(1)) : 0;

      // =========================================================================
      // 4. EVOLUCIÓN TEMPORAL ADAPTATIVA SEGÚN selectedRange
      // =========================================================================
      let evolucionSemanal: { dia: string; total: number }[] = [];

      if (selectedRange === 'today') {
        // Bloques horarios de hoy: 06:00, 09:00, 12:00, 15:00, 18:00, 21:00
        const horas = [
          { dia: '06:00', hStart: 0, hEnd: 8, total: 0 },
          { dia: '09:00', hStart: 8, hEnd: 11, total: 0 },
          { dia: '12:00', hStart: 11, hEnd: 14, total: 0 },
          { dia: '15:00', hStart: 14, hEnd: 17, total: 0 },
          { dia: '18:00', hStart: 17, hEnd: 20, total: 0 },
          { dia: '21:00', hStart: 20, hEnd: 24, total: 0 },
        ];

        scopedElectores.forEach((e) => {
          if (e.created_at) {
            const date = new Date(e.created_at);
            const hour = date.getHours();
            const slot = horas.find((h) => hour >= h.hStart && hour < h.hEnd);
            if (slot) slot.total += 1;
          }
        });

        evolucionSemanal = horas.map(({ dia, total }) => ({ dia, total }));
      } else if (selectedRange === '30days') {
        // 5 intervalos de 6 días
        const bloques = Array.from({ length: 5 }, (_, i) => {
          const startDaysAgo = 30 - i * 6;
          const endDaysAgo = 30 - (i + 1) * 6;
          const dStart = new Date(now.getTime() - startDaysAgo * 24 * 60 * 60 * 1000);
          const dEnd = new Date(now.getTime() - endDaysAgo * 24 * 60 * 60 * 1000);
          return {
            dia: `${dStart.getDate()}/${dStart.getMonth() + 1}`,
            startTime: dStart.getTime(),
            endTime: dEnd.getTime(),
            total: 0,
          };
        });

        scopedElectores.forEach((e) => {
          if (e.created_at) {
            const time = new Date(e.created_at).getTime();
            const b = bloques.find((x) => time >= x.startTime && time < x.endTime);
            if (b) b.total += 1;
          }
        });

        evolucionSemanal = bloques.map(({ dia, total }) => ({ dia, total }));
      } else {
        // '7days' o 'all': 7 días móviles reales
        const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const ultimos7Dias = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return {
            fechaISO: d.toISOString().split('T')[0],
            dia: diasSemana[d.getDay()],
            total: 0,
          };
        });

        scopedElectores.forEach((e) => {
          if (e.created_at) {
            const fecha = String(e.created_at).split('T')[0];
            const target = ultimos7Dias.find((d) => d.fechaISO === fecha);
            if (target) target.total += 1;
          }
        });

        evolucionSemanal = ultimos7Dias.map(({ dia, total }) => ({ dia, total }));
      }

      // =========================================================================
      // 5. DISTRIBUCIÓN POR PUESTO DE VOTACIÓN (AGREGACIÓN DINÁMICA Y REAL)
      // =========================================================================
      const puestosAgrupados: Record<
        string,
        {
          nombrePuesto: string;
          rawPuesto: string;
          zona: 'URBANA' | 'RURAL';
          totalElectores: number;
          mesasSet: Set<string | number>;
          lideresSet: Set<string>;
          electores: any[];
        }
      > = {};

      scopedElectores.forEach((e) => {
        const rawPuesto = e.puesto_votacion ? String(e.puesto_votacion).trim() : 'Sin Asignar';
        const { nombre, zona } = formatCleanPollingPlace(rawPuesto);

        if (!puestosAgrupados[nombre]) {
          puestosAgrupados[nombre] = {
            nombrePuesto: nombre,
            rawPuesto,
            zona,
            totalElectores: 0,
            mesasSet: new Set(),
            lideresSet: new Set(),
            electores: [],
          };
        }
        puestosAgrupados[nombre].totalElectores += 1;

        if (e.mesa !== null && e.mesa !== undefined && e.mesa !== '') {
          puestosAgrupados[nombre].mesasSet.add(e.mesa);
        }

        const leaderId = e.registrado_por || e.created_by;
        if (leaderId) {
          puestosAgrupados[nombre].lideresSet.add(leaderId);
        }

        const foundLeader = perfilesRows.find((p) => p.id === leaderId);
        puestosAgrupados[nombre].electores.push({
          id: e.id || `el-${Math.random()}`,
          cedula: e.cedula || '',
          nombres: e.nombres || '',
          apellidos: e.apellidos || '',
          edad: e.edad !== undefined && e.edad !== null ? Number(e.edad) : null,
          telefono: e.telefono || '',
          puesto_votacion: rawPuesto,
          mesa: e.mesa ?? 1,
          registrado_por: leaderId || null,
          liderNombre: foundLeader?.full_name || 'Líder Operativo',
          created_at: e.created_at,
        });
      });

      const totalPuestosCount = scopedElectores.length;

      const distribucionPuestos: PuestoMetrica[] = Object.values(puestosAgrupados)
        .map((p) => {
          const totalMesas = Math.max(1, p.mesasSet.size);
          const lideresNombres = Array.from(p.lideresSet).map(
            (lid) => perfilesRows.find((prof) => prof.id === lid)?.full_name || 'Líder Operativo'
          );

          return {
            nombrePuesto: p.nombrePuesto,
            rawPuesto: p.rawPuesto,
            zona: p.zona,
            totalElectores: p.totalElectores,
            porcentaje: totalPuestosCount > 0 ? Math.round((p.totalElectores / totalPuestosCount) * 100) : 0,
            mesas: Array.from(p.mesasSet).sort((a, b) => Number(a) - Number(b)),
            totalMesas,
            promedioElectoresPorMesa: Math.round((p.totalElectores / totalMesas) * 10) / 10,
            lideresNombres,
            electores: p.electores,
          };
        })
        .sort((a, b) => b.totalElectores - a.totalElectores);

      // =========================================================================
      // 6. RENDIMIENTO DEL EQUIPO
      // =========================================================================
      const teamProfiles = perfilesRows.filter((p) => p.role !== 'admin' && p.role !== 'candidato');
      const profilesToRender = teamProfiles.length > 0 ? teamProfiles : perfilesRows;

      const rendimientoLideres = profilesToRender.map((p) => {
        const gestionados = conteoPorLider[p.id] || 0;
        const meta = p.meta_electores && p.meta_electores > 0 ? p.meta_electores : 50;
        const avance = meta > 0 ? Math.min(100, Math.round((gestionados / meta) * 100)) : (gestionados > 0 ? 100 : 0);
        return {
          id: p.id,
          nombre: p.full_name || 'Líder Operativo',
          rol: p.role === 'admin' ? 'Administrador' : p.role === 'coordinador' ? 'Coordinador' : 'Líder',
          meta,
          gestionados,
          avance,
          estado: (gestionados > 0 || p.role === 'admin' ? 'ACTIVO' : 'ATENCIÓN') as 'ACTIVO' | 'ATENCIÓN',
        };
      });

      const activosCount = rendimientoLideres.filter((l) => l.estado === 'ACTIVO').length;
      const sinActividadCount = rendimientoLideres.filter((l) => l.estado === 'ATENCIÓN').length;

      // =========================================================================
      // 7. ACTIVIDAD RECIENTE (ÚLTIMOS 5 EVENTOS DEL PERÍODO)
      // =========================================================================
      const sortedElectores = [...scopedElectores].sort((a, b) => {
        const tA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tB - tA;
      }).slice(0, 5);

      const actividadReciente = sortedElectores.map((e, index) => {
        const date = e.created_at ? new Date(e.created_at) : new Date();
        const hora = date.toLocaleTimeString('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        const leaderId = e.registrado_por || e.created_by;
        const foundLeader = perfilesRows.find((p) => p.id === leaderId);
        const registrador = foundLeader?.full_name || e.registrador?.full_name || 'Un líder';

        return {
          id: e.id || `act-${index}`,
          hora,
          texto: `${registrador} registró a ${e.nombres || 'Elector'} ${e.apellidos || ''}${e.puesto_votacion ? ` · ${e.puesto_votacion}` : ''}`,
          tipo: 'elector' as const,
        };
      });

      // =========================================================================
      // 8. NOTIFICACIONES EN VIVO
      // =========================================================================
      const notifications: CampaignNotification[] = [];

      // Notificaciones de los electores más recientes
      const ultimosRegistrados = [...electoresRows]
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 4);

      ultimosRegistrados.forEach((el, idx) => {
        const nom = `${el.nombres || ''} ${el.apellidos || ''}`.trim() || 'Elector';
        const puesto = el.puesto_votacion ? `en ${el.puesto_votacion}` : 'con mesa pendiente';
        const tDiffMin = el.created_at
          ? Math.max(1, Math.round((Date.now() - new Date(el.created_at).getTime()) / 60000))
          : (idx + 1) * 15;
        const tiempoStr =
          tDiffMin < 60
            ? `Hace ${tDiffMin} min`
            : tDiffMin < 1440
            ? `Hace ${Math.round(tDiffMin / 60)}h`
            : `Hace ${Math.round(tDiffMin / 1440)}d`;

        notifications.push({
          id: `notif-elector-${el.id || idx}`,
          tipo: 'elector',
          titulo: 'Nuevo Elector Incorporado',
          descripcion: `${nom} fue enrolado exitosamente ${puesto}.`,
          tiempo: tiempoStr,
          leido: false,
        });
      });

      // Notificación de meta global
      if (metaGlobal > 0) {
        notifications.push({
          id: 'notif-meta-global',
          tipo: 'meta',
          titulo: 'Avance de Meta Municipal',
          descripcion: `La campaña registra ${totalHistorico} electores (${porcentajeAvance}% de la meta de ${metaGlobal.toLocaleString()}).`,
          tiempo: 'Hoy',
          leido: false,
        });
      }

      // Notificación de despliegue territorial
      if (activosCount > 0) {
        notifications.push({
          id: 'notif-lideres-activos',
          tipo: 'lider',
          titulo: 'Despliegue Operativo del Equipo',
          descripcion: `${activosCount} líderes tienen reportes activos en territorio.`,
          tiempo: 'Hoy',
          leido: false,
        });
      }

      // Notificación del sistema
      notifications.push({
        id: 'notif-sistema-sync',
        tipo: 'sistema',
        titulo: 'Sincronización en Tiempo Real',
        descripcion: isSupabaseConfigured
          ? 'Conectado a PostgreSQL Supabase Cloud con datos encriptados.'
          : 'Operando en modo de respaldo local offline con sincronización activa.',
        tiempo: 'Activo',
        leido: true,
      });

      if (isMountedRef.current) {
        setData({
          totalElectores,
          totalHistorico,
          electoresActivos,
          totalLideres,
          lideresActivos: activosCount,
          metaGlobal,
          porcentajeAvance,
          evolucionSemanal,
          distribucionPuestos,
          estadoEquipo: {
            activos: activosCount,
            sinActividad: sinActividadCount,
            pendientes: 0,
            total: totalLideres,
          },
          rendimientoLideres,
          actividadReciente,
          notifications,
        });
      }
    } catch (error) {
      console.error('Error cargando métricas reales del Dashboard:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [activeTenantId, selectedRange]);

  // Suscripción en tiempo real (Supabase Realtime + eventos locales)
  useEffect(() => {
    isMountedRef.current = true;
    fetchDashboardData();

    if (!isSupabaseConfigured) {
      const handleLocalEvent = () => fetchDashboardData();
      window.addEventListener('elector_registered', handleLocalEvent);
      return () => {
        isMountedRef.current = false;
        window.removeEventListener('elector_registered', handleLocalEvent);
      };
    }

    const channel = supabase
      .channel(`dashboard-realtime-${activeTenantId || 'global'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'electores',
        },
        (payload) => {
          console.log('[Realtime Dashboard] Cambio en electores detectado:', payload.eventType);
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          console.log('[Realtime Dashboard] Cambio en equipo/perfiles detectado:', payload.eventType);
          fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenants',
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    const handleLocalEvent = () => fetchDashboardData();
    window.addEventListener('elector_registered', handleLocalEvent);

    return () => {
      isMountedRef.current = false;
      supabase.removeChannel(channel);
      window.removeEventListener('elector_registered', handleLocalEvent);
    };
  }, [fetchDashboardData, activeTenantId]);

  return {
    data,
    metrics: data,
    loading,
    refetch: fetchDashboardData,
  };
}

export default useDashboardData;
