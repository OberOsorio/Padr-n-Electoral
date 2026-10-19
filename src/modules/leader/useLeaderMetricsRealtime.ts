import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { isValidUUID } from '../../utils/uuid';

export interface LeaderMetricsRealtime {
  totalRegistrados: number;
  meta: number;
  conWhatsapp: number;
  puestoPrincipal: string;
  porcentajeAvance: number;
  loading: boolean;
}

export function useLeaderMetricsRealtime(
  userId?: string,
  tenantId?: string | null,
  isOwnerMode: boolean = false
) {
  const [metrics, setMetrics] = useState<LeaderMetricsRealtime>({
    totalRegistrados: 0,
    meta: 50,
    conWhatsapp: 0,
    puestoPrincipal: 'Sin registros aún',
    porcentajeAvance: 0,
    loading: true,
  });

  const calcularMetricas = useCallback(async () => {
    if (!userId && !isOwnerMode) return;

    try {
      // 1. Consultar meta actualizada del perfil o configuración
      let metaActual = 50;
      if (userId && isValidUUID(userId)) {
        const { data: profile } = await (supabase.from('profiles') as any)
          .select('meta_electores')
          .eq('id', userId)
          .maybeSingle();

        if (profile?.meta_electores && Number(profile.meta_electores) > 0) {
          metaActual = Number(profile.meta_electores);
        }
      }

      // 2. Consultar electores según contexto (Dueño vs. Líder estándar)
      let query = (supabase.from('electores') as any)
        .select('id, telefono, puesto_votacion');

      if (!isOwnerMode && userId && isValidUUID(userId)) {
        query = query.eq('registrado_por', userId);
      }

      if (tenantId && isValidUUID(tenantId)) {
        query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
      }

      const { data: electores, error } = await query;
      if (error) throw error;

      const total = electores?.length || 0;

      // Contactos con WhatsApp válido
      const whatsapp = electores?.filter(
        (e: any) => e.telefono && String(e.telefono).trim().length >= 7
      ).length || 0;

      // Puesto con mayor concentración
      let topPuesto = 'Sin registros aún';
      if (electores && electores.length > 0) {
        const puestosCount: Record<string, number> = {};
        electores.forEach((e: any) => {
          const puesto = e.puesto_votacion ? String(e.puesto_votacion).trim() : '';
          if (puesto) {
            puestosCount[puesto] = (puestosCount[puesto] || 0) + 1;
          }
        });
        const ordenados = Object.entries(puestosCount).sort((a, b) => b[1] - a[1]);
        if (ordenados.length > 0) {
          topPuesto = ordenados[0][0];
        }
      }

      const avance = metaActual > 0 ? Math.min(100, Math.round((total / metaActual) * 100)) : 0;

      setMetrics({
        totalRegistrados: total,
        meta: metaActual,
        conWhatsapp: whatsapp,
        puestoPrincipal: topPuesto,
        porcentajeAvance: avance,
        loading: false,
      });
    } catch (err) {
      console.error('Error calculando métricas en vivo:', err);
      setMetrics((prev) => ({ ...prev, loading: false }));
    }
  }, [userId, tenantId, isOwnerMode]);

  useEffect(() => {
    // Carga inicial
    calcularMetricas();

    // 3. Suscripción a canal WebSockets de Supabase Realtime
    const channelName = `realtime-leader-metrics-${userId || 'global'}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'electores' },
        () => {
          // Si agregan, editan o eliminan un elector, recalcula de inmediato
          calcularMetricas();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: userId && isValidUUID(userId) ? `id=eq.${userId}` : undefined,
        },
        () => {
          // Si el administrador cambia la meta del líder, se actualiza en vivo
          calcularMetricas();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, tenantId, isOwnerMode, calcularMetricas]);

  return metrics;
}
