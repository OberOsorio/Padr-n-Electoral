import { useState, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { LOCAL_DEMO_CENSO, calcularEdadDesdeCenso } from '../../services/censoService';

export interface FastElectorSearchResult {
  found: boolean;
  isDuplicate?: boolean;
  duplicateInfo?: {
    registradorNombre: string;
    nombres: string;
    apellidos: string;
    puesto_votacion?: string;
  };
  data?: {
    nombres: string;
    apellidos: string;
    edad?: number | null;
    puesto_votacion?: string | null;
    mesa?: string | null;
    municipio?: string | null;
    departamento?: string | null;
  };
}

export function useFastElectorSearch() {
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const consultarElectorRapido = useCallback(
    async (cedula: string, tenantId?: string | null): Promise<FastElectorSearchResult | null> => {
      const docLimpio = cedula.replace(/\D/g, '').trim();
      if (docLimpio.length < 5) return null;

      // 1. Cancelar consulta previa de inmediato si el usuario sigue digitando
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setLoading(true);

      // 2. Timeout forzado estricto de 2.0 segundos máximo (evita cualquier bloqueo de interfaz)
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 2000);

      try {
        // A. Verificar duplicado en la campaña activa con consulta indexada a Supabase (< 30ms)
        if (tenantId && isSupabaseConfigured) {
          const { data: dupData } = await (supabase.from('electores') as any)
            .select(`
              id,
              nombres,
              apellidos,
              puesto_votacion,
              registrador:profiles(full_name, role)
            `)
            .eq('tenant_id', tenantId)
            .eq('cedula', docLimpio)
            .abortSignal(signal)
            .maybeSingle();

          if (dupData) {
            clearTimeout(timeoutId);
            const registradorNombre = dupData.registrador?.full_name || 'otro líder de la campaña';
            return {
              found: true,
              isDuplicate: true,
              duplicateInfo: {
                registradorNombre,
                nombres: dupData.nombres,
                apellidos: dupData.apellidos,
                puesto_votacion: dupData.puesto_votacion || 'Principal',
              },
            };
          }
        }

        // B. Comprobar banco en memoria / caché local instantáneo (< 1ms)
        const demo = LOCAL_DEMO_CENSO[docLimpio];
        if (demo) {
          clearTimeout(timeoutId);
          return {
            found: true,
            isDuplicate: false,
            data: {
              nombres: demo.nombres,
              apellidos: demo.apellidos,
              edad: demo.edad ?? null,
              puesto_votacion: demo.puesto_sugerido ?? null,
              mesa: demo.mesa_sugerida ? String(demo.mesa_sugerida) : null,
            },
          };
        }

        // C. Consulta directa indexada en Supabase a censo_maestro (< 50ms)
        if (isSupabaseConfigured) {
          const { data: censo, error: censoErr } = await (supabase.from('censo_maestro') as any)
            .select('nombres, apellidos, edad, puesto_sugerido, mesa_sugerida, municipio, departamento')
            .eq('cedula', docLimpio)
            .abortSignal(signal)
            .maybeSingle();

          clearTimeout(timeoutId);

          if (!censoErr && censo && censo.nombres) {
            const edadCalculada = calcularEdadDesdeCenso(censo.edad);
            return {
              found: true,
              isDuplicate: false,
              data: {
                nombres: censo.nombres,
                apellidos: censo.apellidos || '',
                edad: edadCalculada !== '' ? Number(edadCalculada) : (censo.edad ? Number(censo.edad) : null),
                puesto_votacion: censo.puesto_sugerido || null,
                mesa: censo.mesa_sugerida ? String(censo.mesa_sugerida) : null,
                municipio: censo.municipio || null,
                departamento: censo.departamento || null,
              },
            };
          }
        }

        clearTimeout(timeoutId);
        return { found: false, isDuplicate: false };
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          console.warn('Consulta de elector cancelada por timeout o nueva pulsación.');
        } else {
          console.error('Error en búsqueda rápida de elector:', err);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { consultarElectorRapido, loading };
}
