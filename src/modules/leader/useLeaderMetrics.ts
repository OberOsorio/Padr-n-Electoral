import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';

export interface LeaderMetrics {
  totalRegistrados: number;
  meta: number;
  conWhatsapp: number;
  puestoPrincipal: string;
  porcentajeAvance: number;
}

export function useLeaderMetrics(userId?: string) {
  const [metrics, setMetrics] = useState<LeaderMetrics>({
    totalRegistrados: 0,
    meta: 50,
    conWhatsapp: 0,
    puestoPrincipal: 'Sin registros aún',
    porcentajeAvance: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchLeaderData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // 1. Obtener la meta asignada desde profiles (o fallback a 50)
      let metaFijada = 50;
      try {
        const { data: profile } = await (supabase.from('profiles') as any)
          .select('meta_electores')
          .eq('id', userId)
          .maybeSingle();

        if (profile?.meta_electores && profile.meta_electores > 0) {
          metaFijada = profile.meta_electores;
        }
      } catch (profErr) {
        console.warn('Aviso consultando meta_electores del perfil:', profErr);
      }

      // 2. Consultar electores reales registrados por el líder en Supabase
      let electores: Array<{ id: string; telefono?: string | null; puesto_votacion?: string | null }> = [];
      try {
        const { data, error } = await (supabase.from('electores') as any)
          .select('id, telefono, puesto_votacion')
          .eq('registrado_por', userId);

        if (error) {
          throw error;
        }
        electores = data || [];
      } catch (errDb) {
        console.warn('Aviso consultando electores de Supabase para métricas:', errDb);
        // Respaldo de contingencia local si no hay conexión
        try {
          const stored = localStorage.getItem('electoral_leader_electors');
          if (stored) {
            const localList = JSON.parse(stored);
            electores = localList.filter((e: any) => e.registrado_por === userId);
          }
        } catch {
          // ignore
        }
      }

      const total = electores.length;

      // 3. Electores con número de contacto válido para fidelización WhatsApp
      const whatsappCount = electores.filter(
        (e) => e.telefono && e.telefono.trim().replace(/\D/g, '').length >= 7
      ).length;

      // 4. Identificar el puesto de votación con mayor concentración de electores
      let topPuesto = 'Sin registros aún';
      if (electores.length > 0) {
        const frecuencias: Record<string, number> = {};
        electores.forEach((e) => {
          const puesto = e.puesto_votacion?.trim();
          if (puesto) {
            frecuencias[puesto] = (frecuencias[puesto] || 0) + 1;
          }
        });
        const ordenados = Object.entries(frecuencias).sort((a, b) => b[1] - a[1]);
        if (ordenados.length > 0) {
          topPuesto = ordenados[0][0];
        }
      }

      const porcentaje = metaFijada > 0 ? Math.min(100, Math.round((total / metaFijada) * 100)) : 0;

      setMetrics({
        totalRegistrados: total,
        meta: metaFijada,
        conWhatsapp: whatsappCount,
        puestoPrincipal: topPuesto,
        porcentajeAvance: porcentaje,
      });
    } catch (err) {
      console.error('Error cargando métricas del líder:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLeaderData();

    // Sincronización Realtime con Supabase si está disponible
    if (!userId) return;

    const channel = supabase
      .channel(`leader_metrics_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'electores',
          filter: `registrado_por=eq.${userId}`,
        },
        () => {
          fetchLeaderData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchLeaderData]);

  return { metrics, loading, refetch: fetchLeaderData };
}
