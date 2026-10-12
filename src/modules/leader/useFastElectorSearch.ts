import { useState, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { estimarEdadPorCedula } from '../../services/censoService';
import { parseConsultaDinamica } from '../../utils/electorResponseParser';

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

      // 2. Timeout forzado de 6.0 segundos máximo (garantiza handshake DNP sin colgar interfaz)
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 6000);

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

        // B. Consulta directa y prioritaria a Ventanilla Social DNP (https://ventanillasocial.dnp.gov.co/)
        try {
          const res = await fetch('/api/dnp-lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cedula: docLimpio, tipoDoc: '3' }),
            signal,
          });

          if (res.ok) {
            const dnpData = await res.json();
            if (dnpData && dnpData.encontrado) {
              clearTimeout(timeoutId);
              const elector = parseConsultaDinamica({
                ok: true,
                nombres: dnpData.nombres,
                apellidos: dnpData.apellidos,
                edad: dnpData.edad,
                municipio: dnpData.municipio,
                departamento: dnpData.departamento,
                ...(dnpData.raw || {}),
              });

              if (elector) {
                let edadCalculada = elector.edad ? Number(elector.edad) : null;
                if (!edadCalculada) {
                  const est = estimarEdadPorCedula(docLimpio);
                  if (est !== '') edadCalculada = Number(est);
                }

                return {
                  found: true,
                  isDuplicate: false,
                  data: {
                    nombres: elector.nombres,
                    apellidos: elector.apellidos,
                    edad: edadCalculada,
                    puesto_votacion: null,
                    mesa: null,
                    municipio: elector.municipio || dnpData.municipio || null,
                    departamento: elector.departamento || dnpData.departamento || null,
                  },
                };
              }
            }
          }
        } catch (fetchErr: any) {
          if (fetchErr.name === 'AbortError') throw fetchErr;
          console.warn('Aviso en consulta Ventanilla Social DNP:', fetchErr);
        }

        // C. Fallback secundario a Supabase censo_maestro (solo lectura, sin guardar nada)
        if (isSupabaseConfigured) {
          const { data: censo, error: censoErr } = await (supabase.from('censo_maestro') as any)
            .select('*')
            .eq('cedula', docLimpio)
            .abortSignal(signal)
            .maybeSingle();

          clearTimeout(timeoutId);

          if (!censoErr && censo) {
            const elector = parseConsultaDinamica(censo);
            if (elector) {
              let edadCalculada = elector.edad ? Number(elector.edad) : null;
              if (!edadCalculada) {
                const est = estimarEdadPorCedula(docLimpio);
                if (est !== '') edadCalculada = Number(est);
              }

              return {
                found: true,
                isDuplicate: false,
                data: {
                  nombres: elector.nombres,
                  apellidos: elector.apellidos,
                  edad: edadCalculada,
                  puesto_votacion: censo.puesto_sugerido || censo.puesto_votacion || censo.puesto || null,
                  mesa: censo.mesa_sugerida ? String(censo.mesa_sugerida) : (censo.mesa ? String(censo.mesa) : null),
                  municipio: elector.municipio || censo.municipio || null,
                  departamento: elector.departamento || censo.departamento || null,
                },
              };
            }
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
