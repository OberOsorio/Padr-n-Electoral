import { useState, useRef, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { isValidUUID } from '../../utils/uuid';

export interface ElectorLookupResult {
  nombres: string;
  apellidos: string;
  edad: string;
  municipio?: string;
  departamento?: string;
  puesto_votacion?: string;
  mesa?: string;
  duplicado?: boolean;
  mensaje?: string;
}

export function useElectorSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const buscarDocumento = useCallback(
    async (documento: string, tenantId?: string | null): Promise<ElectorLookupResult | null> => {
      const docLimpio = String(documento || '').replace(/\D/g, '').trim();
      if (docLimpio.length < 5) return null;

      // 1. Cancelar cualquier petición en vuelo para evitar condiciones de carrera (Race Conditions)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setError(null);

      // 2. Timeout estricto de 4 segundos para evitar que la UI se congele
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 4000);

      try {
        // 3. Petición estándar compatible con todos los navegadores (Firefox, Safari, Chrome, Edge)
        let res: any = null;
        try {
          const response = await fetch('/api/search-elector', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
            },
            body: JSON.stringify({
              cedula: docLimpio,
              tenantId: tenantId || null,
            }),
            signal: abortControllerRef.current.signal,
          });

          if (response.ok) {
            const ct = response.headers.get('content-type') || '';
            if (ct.includes('application/json')) {
              res = await response.json();
            }
          }
        } catch {
          // Evaluar fallback de red
        }

        // 4. Fallback de alta resiliencia directo a Supabase
        if (!res || (!res.encontrado && !res.duplicado)) {
          try {
            // Anti-duplicado en campaña activa
            if (tenantId && isValidUUID(tenantId)) {
              const { data: existente } = await (supabase as any)
                .from('electores')
                .select('id, nombres, apellidos, puesto_votacion')
                .eq('tenant_id', tenantId)
                .eq('cedula', docLimpio)
                .maybeSingle();

              if (existente) {
                res = {
                  ok: true,
                  duplicado: true,
                  encontrado: false,
                  mensaje: `Elector ya registrado (${existente.nombres} ${existente.apellidos}).`,
                  data: {
                    nombres: existente.nombres,
                    apellidos: existente.apellidos,
                    puesto_votacion: existente.puesto_votacion || '',
                  },
                };
              }
            }

            if (!res?.duplicado) {
              const { data: persona } = await (supabase as any)
                .from('censo_electoral')
                .select('nombres, apellidos, edad, anio_nacimiento, puesto_votacion, mesa, municipio, departamento')
                .eq('cedula', docLimpio)
                .maybeSingle();

              if (persona) {
                let edadFinal = persona.edad ? String(persona.edad) : '';
                if (!edadFinal && persona.anio_nacimiento) {
                  const anio = parseInt(String(persona.anio_nacimiento), 10);
                  if (!isNaN(anio) && anio > 1900) {
                    edadFinal = String(new Date().getFullYear() - anio);
                  }
                }

                res = {
                  ok: true,
                  duplicado: false,
                  encontrado: true,
                  nombres: persona.nombres || '',
                  apellidos: persona.apellidos || '',
                  edad: edadFinal,
                  puesto_votacion: persona.puesto_votacion || '',
                  mesa: persona.mesa ? String(persona.mesa) : '',
                  municipio: persona.municipio || '',
                  departamento: persona.departamento || '',
                };
              } else {
                const { data: maestro } = await (supabase as any)
                  .from('censo_maestro')
                  .select('nombres, apellidos, edad, puesto_sugerido, mesa_sugerida, municipio, departamento')
                  .eq('cedula', docLimpio)
                  .maybeSingle();

                if (maestro) {
                  res = {
                    ok: true,
                    duplicado: false,
                    encontrado: true,
                    nombres: maestro.nombres || '',
                    apellidos: maestro.apellidos || '',
                    edad: maestro.edad ? String(maestro.edad) : '',
                    puesto_votacion: maestro.puesto_sugerido || '',
                    mesa: maestro.mesa_sugerida ? String(maestro.mesa_sugerida) : '',
                    municipio: maestro.municipio || '',
                    departamento: maestro.departamento || '',
                  };
                }
              }
            }
          } catch (dbErr) {
            console.warn('Error en fallback directo Supabase:', dbErr);
          }
        }

        clearTimeout(timeoutId);

        // Caso A: Duplicado en la campaña activa
        if (res && res.duplicado) {
          return {
            nombres: res.data?.nombres || res.nombres || '',
            apellidos: res.data?.apellidos || res.apellidos || '',
            edad: '',
            duplicado: true,
            mensaje: res.mensaje || 'Elector ya registrado en esta campaña.',
          };
        }

        // Caso B: Manejo si el documento fue eliminado o no existe en los registros
        if (!res || res.encontrado === false || res.ok === false) {
          return null;
        }

        const payloadData = res.data || res;
        const nombresVal = payloadData?.nombres || res?.nombres || '';
        const apellidosVal = payloadData?.apellidos || res?.apellidos || '';

        if (!nombresVal && !apellidosVal) {
          return null;
        }

        // Caso C: Documento verificado
        return {
          nombres: nombresVal,
          apellidos: apellidosVal,
          edad:
            payloadData?.edad !== undefined && payloadData?.edad !== null
              ? String(payloadData.edad)
              : (res.edad ? String(res.edad) : ''),
          municipio: payloadData?.municipio || res.municipio || '',
          departamento: payloadData?.departamento || res.departamento || '',
          puesto_votacion: payloadData?.puesto_votacion || payloadData?.puesto_sugerido || res.puesto_votacion || '',
          mesa:
            payloadData?.mesa || payloadData?.mesa_sugerida || res.mesa
              ? String(payloadData?.mesa || payloadData?.mesa_sugerida || res.mesa)
              : '',
          duplicado: false,
          mensaje: res.mensaje || '',
        };
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.warn('[QA-Lookup] Petición cancelada o excedió el tiempo límite (Timeout).');
        } else {
          console.error('[QA-Lookup Error]:', err);
          setError(err.message || 'Error de comunicación.');
        }
        return null;
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    },
    []
  );

  return { buscarDocumento, loading, error };
}
