import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { getPollingPlacesForTenant } from '../../services/divipoleService';
import type { Tenant } from '../../types';

export function useJurisdictionPuestos(activeTenant?: Tenant | null) {
  const [puestosCampana, setPuestosCampana] = useState<string[]>([]);
  const [loadingPuestos, setLoadingPuestos] = useState<boolean>(false);

  const getPuestosCampana = useCallback(async (): Promise<string[]> => {
    if (!activeTenant?.id) {
      setPuestosCampana([]);
      return [];
    }

    setLoadingPuestos(true);
    try {
      const setPuestos = new Set<string>();

      // 1. Consultar los puestos únicos que realmente tienen electores registrados en esta campaña
      if (isSupabaseConfigured) {
        const { data, error } = await (supabase.from('electores') as any)
          .select('puesto_votacion')
          .eq('tenant_id', activeTenant.id)
          .not('puesto_votacion', 'is', null);

        if (!error && Array.isArray(data)) {
          data.forEach((d: any) => {
            const p = d.puesto_votacion?.trim();
            if (p) setPuestos.add(p);
          });
        }
      } else {
        const stored = localStorage.getItem('electoral_local_electors');
        const list: any[] = stored ? JSON.parse(stored) : [];
        list
          .filter((e) => e.tenant_id === activeTenant.id)
          .forEach((e) => {
            const p = e.puesto_votacion?.trim();
            if (p) setPuestos.add(p);
          });
      }

      // 2. Si la campaña aún no tiene electores registrados o para completar los puestos oficiales de su municipio,
      // agregar únicamente los puestos de la jurisdicción de activeTenant (municipio + departamento)
      if (setPuestos.size === 0) {
        const officialPlaces = getPollingPlacesForTenant(activeTenant);
        officialPlaces.forEach((p) => {
          if (p.name?.trim()) setPuestos.add(p.name.trim());
        });
      }

      const puestosUnicos = Array.from(setPuestos).sort((a, b) =>
        a.localeCompare(b, 'es-CO')
      );

      setPuestosCampana(puestosUnicos);
      return puestosUnicos;
    } catch (err) {
      console.error('Error al cargar puestos de la campaña:', err);
      return [];
    } finally {
      setLoadingPuestos(false);
    }
  }, [activeTenant]);

  useEffect(() => {
    getPuestosCampana();

    if (!isSupabaseConfigured || !activeTenant?.id) return;

    const canalPuestos = supabase
      .channel(`realtime-puestos-${activeTenant.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'electores',
        },
        () => {
          getPuestosCampana();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalPuestos);
    };
  }, [getPuestosCampana, activeTenant?.id]);

  return {
    puestosCampana,
    loadingPuestos,
    getPuestosCampana,
  };
}
