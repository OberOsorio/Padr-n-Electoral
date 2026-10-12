import { useState, useRef, useCallback } from 'react';

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

        // 4. Fallback de alta resiliencia si el host actual no tiene el proxy activo o devolvió vacío
        if (!res || (!res.encontrado && !res.duplicado)) {
          const fallbackUrls = [
            'https://padron-electoral.aethelcodesas.workers.dev/api/search-elector',
            'https://cut-tracked-thereafter-fundamentals.trycloudflare.com/api/search-elector',
          ];

          for (const fbUrl of fallbackUrls) {
            try {
              if (window.location.origin.includes(new URL(fbUrl).host)) continue;
              const fbResponse = await fetch(fbUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  cedula: docLimpio,
                  tenantId: tenantId || null,
                }),
                signal: abortControllerRef.current.signal,
              });

              if (fbResponse.ok) {
                const fbJson = await fbResponse.json();
                if (fbJson && (fbJson.encontrado || fbJson.duplicado)) {
                  res = fbJson;
                  break;
                }
              }
            } catch {
              // Continuar con siguiente endpoint
            }
          }
        }

        clearTimeout(timeoutId);

        // Caso A: Duplicado en la campaña activa
        if (res && res.duplicado) {
          return {
            nombres: res.data?.nombres || '',
            apellidos: res.data?.apellidos || '',
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
        if (!payloadData || (!payloadData.nombres && !payloadData.apellidos)) {
          return null;
        }

        // Caso C: Documento verificado
        return {
          nombres: payloadData.nombres || '',
          apellidos: payloadData.apellidos || '',
          edad:
            payloadData.edad !== undefined && payloadData.edad !== null
              ? String(payloadData.edad)
              : '',
          municipio: payloadData.municipio || '',
          departamento: payloadData.departamento || '',
          puesto_votacion: payloadData.puesto_votacion || payloadData.puesto_sugerido || '',
          mesa:
            payloadData.mesa || payloadData.mesa_sugerida
              ? String(payloadData.mesa || payloadData.mesa_sugerida)
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
