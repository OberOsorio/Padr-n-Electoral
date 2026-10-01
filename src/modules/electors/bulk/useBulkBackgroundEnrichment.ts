import { useState, useRef, useCallback, useEffect } from 'react';
import { censoService, calcularEdadDesdeCenso } from '../../../services/censoService';
import { parseNombreCompleto } from '../../../utils/nameParser';

export interface ElectorImportItem {
  id?: string;
  _rowNumber?: number;
  cedula: string;
  nombres?: string;
  apellidos?: string;
  nombre_completo?: string;
  telefono?: string | null;
  edad?: number | string | null;
  puesto_votacion?: string;
  mesa?: string | number;
  notas?: string | null;
  nombre_corregido?: boolean;
  nombre_fue_corregido?: boolean;
  nombre_original?: string;
  nombre_original_archivo?: string;
  verificado_censo?: boolean;
  isEnriching?: boolean;
  isAutofilled?: boolean;
  autofillSource?: 'censo_maestro' | 'file';
  [key: string]: any;
}

export interface EnrichmentProgress {
  actual: number;
  total: number;
  corregidos: number;
}

/**
 * Normaliza cadenas para comparación fonética/ortográfica
 * Quita tildes, convierte a minúsculas y colapsa espacios en blanco
 */
export function normalizarTexto(str?: string | null): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calcula la edad en años a partir de cualquier formato devuelto por la base de datos o API
 */
export function calcularEdad(valorEdadOFecNac: any): number | null {
  const edadCalculada = calcularEdadDesdeCenso(valorEdadOFecNac);
  if (typeof edadCalculada === 'number' && edadCalculada > 0 && edadCalculada < 125) {
    return Math.floor(edadCalculada);
  }
  return null;
}

export type ToastCallback = (
  mensaje: string,
  cedula: string,
  nombreOriginal?: string,
  nombreOficial?: string
) => void;

/**
 * Hook para procesar el enriquecimiento y autocorrección de electores en segundo plano.
 * No bloquea la interfaz de usuario y procesa peticiones en lotes concurrentes (pool de 3-4 peticiones).
 */
export function useBulkBackgroundEnrichment(notificarCambioNombre?: ToastCallback) {
  const [procesandoEnSegundoPlano, setProcesandoEnSegundoPlano] = useState(false);
  const [progreso, setProgreso] = useState<EnrichmentProgress | null>(null);

  const isMountedRef = useRef(true);
  const activeRunIdRef = useRef<number>(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      activeRunIdRef.current++;
    };
  }, []);

  const cancelarEnriquecimiento = useCallback(() => {
    activeRunIdRef.current++;
    setProcesandoEnSegundoPlano(false);
  }, []);

  const enriquecerEnSegundoPlano = useCallback(
    async (
      listaInicial: ElectorImportItem[],
      onActualizarItem: (indice: number, itemActualizado: ElectorImportItem) => void
    ) => {
      if (!listaInicial || listaInicial.length === 0) return;

      const runId = ++activeRunIdRef.current;

      // 1. Detección Automática: Registros que no traen edad o requieren verificación oficial
      // Consideramos pendientes aquellos con edad nula, 0, 'N/A' o sin verificación del censo
      const pendientes = listaInicial
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => {
          const sinEdad =
            item.edad === null ||
            item.edad === undefined ||
            item.edad === '' ||
            item.edad === 0 ||
            item.edad === '0' ||
            item.edad === 'N/A' ||
            item.edad === 'n/a';
          return sinEdad || !item.verificado_censo;
        });

      if (pendientes.length === 0) {
        setProcesandoEnSegundoPlano(false);
        setProgreso(null);
        return;
      }

      setProcesandoEnSegundoPlano(true);
      setProgreso({ actual: 0, total: pendientes.length, corregidos: 0 });

      // 2. Consulta en Segundo Plano: Lotes concurrentes con pool de 4 peticiones en paralelo
      const CONCURRENCIA = 4;
      let cursor = 0;
      let completados = 0;
      let totalCorregidos = 0;

      const procesarUno = async () => {
        while (cursor < pendientes.length) {
          if (!isMountedRef.current || activeRunIdRef.current !== runId) return;

          const idxPendiente = cursor++;
          const { item, index } = pendientes[idxPendiente];
          const cleanCedula = (item.cedula || '').toString().trim().replace(/\D/g, '');

          if (!cleanCedula) {
            completados++;
            if (isMountedRef.current && activeRunIdRef.current === runId) {
              setProgreso({ actual: completados, total: pendientes.length, corregidos: totalCorregidos });
            }
            continue;
          }

          // Marcar fila como en proceso de enriquecimiento para feedback sutil en UI
          const itemEnProceso: ElectorImportItem = {
            ...item,
            isEnriching: true,
          };
          onActualizarItem(index, itemEnProceso);

          try {
            const resultado = await censoService.consultarPorCedula(cleanCedula);

            if (!isMountedRef.current || activeRunIdRef.current !== runId) return;

            if (resultado && (resultado.encontrado || resultado.found)) {
              // 3. Cálculo y Asignación de Edad
              let edadCalculada = resultado.edad ? Number(resultado.edad) : null;
              if ((!edadCalculada || edadCalculada <= 0) && (resultado.fecha_nacimiento || (resultado as any).nacimiento)) {
                edadCalculada = calcularEdad(resultado.fecha_nacimiento || (resultado as any).nacimiento);
              }
              // Fallback a estimación si no vino edad explícita
              if ((!edadCalculada || edadCalculada <= 0) && (!item.edad || item.edad === 'N/A')) {
                const est = censoService.estimarEdadPorCedula(cleanCedula);
                if (typeof est === 'number') {
                  edadCalculada = est;
                }
              }

              // 4. Verificación y Corrección de Nombre
              const censoNombres = (resultado.nombres || '').trim();
              const censoApellidos = (resultado.apellidos || '').trim();
              const nombreOficial = (resultado.nombre_completo || `${censoNombres} ${censoApellidos}`).trim();

              const nombreArchivo =
                item.nombre_original ||
                item.nombre_original_archivo ||
                item.nombre_completo ||
                `${item.nombres || ''} ${item.apellidos || ''}`.trim();

              const difieren =
                Boolean(nombreOficial) &&
                normalizarTexto(nombreArchivo) !== normalizarTexto(nombreOficial);

              const parsedOficial = nombreOficial ? parseNombreCompleto(nombreOficial) : null;

              const itemActualizado: ElectorImportItem = {
                ...item,
                isEnriching: false,
                verificado_censo: true,
                isAutofilled: true,
                autofillSource: 'censo_maestro',
                // Edad final
                edad: edadCalculada !== null && edadCalculada > 0 ? edadCalculada : item.edad,
                // Si el nombre difiere, reemplazar por el oficial y marcar con badge
                nombre_completo: difieren ? nombreOficial : (item.nombre_completo || nombreOficial || nombreArchivo),
                nombres: difieren && parsedOficial?.nombres ? parsedOficial.nombres : (item.nombres || parsedOficial?.nombres || censoNombres),
                apellidos: difieren && parsedOficial?.apellidos ? parsedOficial.apellidos : (item.apellidos || parsedOficial?.apellidos || censoApellidos),
                nombre_fue_corregido: difieren || item.nombre_fue_corregido || false,
                nombre_corregido: difieren || item.nombre_corregido || false,
                nombre_original: item.nombre_original || nombreArchivo,
                nombre_original_archivo: item.nombre_original_archivo || nombreArchivo,
                // Preservar puesto y mesa existentes del archivo; si no tenía, sugerir del censo
                puesto_votacion: item.puesto_votacion && item.puesto_votacion !== 'Sede Principal (Por Asignar)'
                  ? item.puesto_votacion
                  : (resultado.puesto_sugerido || resultado.puesto_votacion || item.puesto_votacion),
                mesa: item.mesa && item.mesa !== 1 && item.mesa !== '1'
                  ? item.mesa
                  : (resultado.mesa_sugerida || resultado.mesa || item.mesa || 1),
              };

              onActualizarItem(index, itemActualizado);

              // 5. Notificación Toast del Cambio si difiere
              if (difieren) {
                totalCorregidos++;
                const mensaje = `Nombre corregido por Censo: '${nombreArchivo}' ➔ '${nombreOficial}' (Cédula: ${cleanCedula})`;
                notificarCambioNombre?.(mensaje, cleanCedula, nombreArchivo, nombreOficial);
              }
            } else {
              // No encontrado en censo: quitar estado enriching
              const itemSinCambio: ElectorImportItem = {
                ...item,
                isEnriching: false,
                verificado_censo: false,
              };
              onActualizarItem(index, itemSinCambio);
            }
          } catch (err) {
            console.warn(`[BackgroundEnrichment] Error consultando cédula ${cleanCedula}:`, err);
            const itemError: ElectorImportItem = {
              ...item,
              isEnriching: false,
            };
            onActualizarItem(index, itemError);
          } finally {
            completados++;
            if (isMountedRef.current && activeRunIdRef.current === runId) {
              setProgreso({
                actual: Math.min(completados, pendientes.length),
                total: pendientes.length,
                corregidos: totalCorregidos,
              });
            }
          }
        }
      };

      const workers = Array.from(
        { length: Math.min(CONCURRENCIA, pendientes.length) },
        () => procesarUno()
      );

      await Promise.all(workers);

      if (isMountedRef.current && activeRunIdRef.current === runId) {
        setProcesandoEnSegundoPlano(false);
      }
    },
    [notificarCambioNombre]
  );

  return {
    enriquecerEnSegundoPlano,
    procesandoEnSegundoPlano,
    progreso,
    cancelarEnriquecimiento,
  };
}
